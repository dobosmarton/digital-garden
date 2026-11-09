// WebMCP tool definitions (https://webmachinelearning.github.io/webmcp/).
// Loaded on demand by components/webmcp.tsx, only in browsers that support WebMCP.
//
// Conventions, following Chrome's WebMCP guidance:
// - Inputs are validated in code; schema constraints are not guaranteed to be enforced.
// - Failures are returned as `{ error }` with a message the agent can act on, because
//   a thrown error only reaches the agent as an opaque exception name.
// - Tools resolve only once the page reflects the result (navigation, theme).
// - Outputs stay small: search is capped and long posts are read in parts.

import { z } from "zod";

import { subscribeToNewsletter } from "@/lib/newsletter";
import type { PostDetail, PostIndex, PostSummary } from "@/lib/post-api";

export type ToolContext = {
  navigate: (href: string) => Promise<void>;
  setTheme: (theme: string) => void;
};

const THEMES = ["light", "dark", "system"] as const;
const DEFAULT_SEARCH_LIMIT = 5;
const MAX_SEARCH_LIMIT = 20;

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

const currentAppearance = () => (document.documentElement.classList.contains("dark") ? "dark" : "light");

// next-themes applies the theme class in an effect after the state update; wait for it.
function waitForAppearance(expected: "light" | "dark", timeoutMs = 2_000): Promise<"light" | "dark"> {
  return new Promise((resolve) => {
    if (currentAppearance() === expected) return resolve(expected);
    const finish = () => {
      observer.disconnect();
      clearTimeout(timeout);
      resolve(currentAppearance());
    };
    const observer = new MutationObserver(() => currentAppearance() === expected && finish());
    const timeout = setTimeout(finish, timeoutMs);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  });
}

const invalidInput = (error: z.ZodError) => ({
  error: `Invalid input: ${error.issues
    .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
    .join("; ")}`,
});

// Static JSON, fetched once per page session. A failed fetch is retried on the next call.
function cachedJson<T>() {
  const cache = new Map<string, Promise<T | null>>();
  return (url: string) => {
    if (!cache.has(url)) {
      const request = fetch(url).then((response) => (response.ok ? (response.json() as Promise<T>) : null));
      request.then(
        (result) => result === null && cache.delete(url),
        () => cache.delete(url)
      );
      cache.set(url, request);
    }
    return cache.get(url)!;
  };
}

const fetchIndex = cachedJson<PostIndex>();
const fetchPost = cachedJson<PostDetail>();
const INDEX_URL = "/api/posts";
const INDEX_UNAVAILABLE = { error: "The post index is temporarily unavailable. Please try again." };

function matchesQuery(post: PostSummary, query: string) {
  const haystack = [post.title, post.description, post.series?.title, ...post.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

const searchInput = z.object({
  query: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  limit: z.number().int().min(1).max(MAX_SEARCH_LIMIT).optional(),
});

const getPostInput = z.object({
  slug: z.string().trim().min(1),
  part: z.number().int().min(1).optional(),
});

const openPageInput = z.object({ path: z.string().trim().min(1) });
const setThemeInput = z.object({ theme: z.enum(THEMES) });
const subscribeInput = z.object({ email: z.string().trim().pipe(z.email()) });

export function createTools({ navigate, setTheme }: ToolContext): WebMCP.ModelContextTool[] {
  return [
    {
      name: "search_posts",
      title: "Search blog posts",
      description: `Finds blog posts by keywords and/or tag, newest first. Keywords match the title, description, series and tags; every keyword must match. With no arguments it lists the latest posts. Returns up to ${DEFAULT_SEARCH_LIMIT} posts unless a limit is given, plus the total match count.`,
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: 'Space-separated keywords, e.g. "claude agents".' },
          tag: { type: "string", description: "Exact tag, as returned by list_tags." },
          limit: { type: "integer", minimum: 1, maximum: MAX_SEARCH_LIMIT, description: "Maximum posts to return." },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const parsed = searchInput.safeParse(input);
        if (!parsed.success) return invalidInput(parsed.error);
        const { query, tag, limit = DEFAULT_SEARCH_LIMIT } = parsed.data;

        const index = await fetchIndex(INDEX_URL);
        if (!index) return INDEX_UNAVAILABLE;
        const knownTag = tag && index.tags.find((t) => t.tag.toLowerCase() === tag.toLowerCase())?.tag;
        if (tag && !knownTag) {
          return { error: `Unknown tag "${tag}". Available tags: ${index.tags.map((t) => t.tag).join(", ")}.` };
        }

        const matches = index.posts.filter(
          (post) => (!knownTag || post.tags.includes(knownTag)) && (!query || matchesQuery(post, query))
        );
        return { total: matches.length, posts: matches.slice(0, limit) };
      },
    },
    {
      name: "get_post",
      title: "Read a blog post",
      description:
        "Reads a blog post's MDX source by slug. Long posts come in parts: part 1 (the default) also includes the metadata and an outline that maps each heading to its part, so you can jump straight to the relevant part.",
      inputSchema: {
        type: "object",
        properties: {
          slug: { type: "string", description: "Post slug, as returned by search_posts." },
          part: { type: "integer", minimum: 1, description: "Part number to read; defaults to 1." },
        },
        required: ["slug"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const parsed = getPostInput.safeParse(input);
        if (!parsed.success) return invalidInput(parsed.error);
        const { slug, part = 1 } = parsed.data;

        const post = await fetchPost(`/api/posts/${encodeURIComponent(slug)}`);
        if (!post) return { error: `No published post has the slug "${slug}". Use search_posts to find slugs.` };

        const totalParts = post.parts.length;
        if (part > totalParts)
          return { error: `Post "${slug}" has ${totalParts} part(s); part ${part} does not exist.` };

        const { parts, outline, ...metadata } = post;
        const content = parts[part - 1];
        return part === 1 ? { ...metadata, outline, part, totalParts, content } : { slug, part, totalParts, content };
      },
    },
    {
      name: "list_tags",
      title: "List tags",
      description: "Lists every tag on the blog with its post count, most used first.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async () => {
        const index = await fetchIndex(INDEX_URL);
        return index ? { tags: index.tags } : INDEX_UNAVAILABLE;
      },
    },
    {
      name: "open_page",
      title: "Open a page on this site",
      description:
        'Navigates the current tab to a page on this site and resolves once it has loaded. Accepts site-relative paths such as "/posts/<slug>", "/posts/<slug>#<heading-id>" (ids from get_post\'s outline), "/tags/<tag>", "/posts" or "/".',
      inputSchema: {
        type: "object",
        properties: { path: { type: "string", description: 'Site-relative path starting with "/".' } },
        required: ["path"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const parsed = openPageInput.safeParse(input);
        if (!parsed.success) return invalidInput(parsed.error);

        const target = new URL(parsed.data.path, window.location.origin);
        if (!parsed.data.path.startsWith("/") || target.origin !== window.location.origin) {
          return { error: 'Only pages on this site can be opened; pass a path that starts with "/".' };
        }

        await navigate(target.pathname + target.search + target.hash);
        if (window.location.pathname !== target.pathname) {
          return { error: `Navigation to ${target.pathname} did not complete.` };
        }
        await nextFrame();
        return { path: window.location.pathname + window.location.hash, title: document.title };
      },
    },
    {
      name: "set_theme",
      title: "Change the color theme",
      description: 'Sets the site\'s color theme to "light", "dark", or "system" (follow the OS setting).',
      inputSchema: {
        type: "object",
        properties: { theme: { type: "string", enum: THEMES } },
        required: ["theme"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const parsed = setThemeInput.safeParse(input);
        if (!parsed.success) return invalidInput(parsed.error);

        const { theme } = parsed.data;
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const expected = theme === "system" ? (prefersDark ? "dark" : "light") : theme;

        setTheme(theme);
        const appearance = await waitForAppearance(expected);
        return { theme, appearance };
      },
    },
    {
      name: "subscribe_newsletter",
      title: "Subscribe to the newsletter",
      description:
        "Subscribes the email address the user gives you to the blog's newsletter. The subscription becomes active once the user clicks the confirmation link emailed to them.",
      inputSchema: {
        type: "object",
        properties: { email: { type: "string", format: "email", description: "The user's email address." } },
        required: ["email"],
        additionalProperties: false,
      },
      annotations: { consequentialHint: true },
      execute: async (input, { signal }) => {
        const parsed = subscribeInput.safeParse(input);
        if (!parsed.success) return invalidInput(parsed.error);

        // No `elapsedMs`: the form's time-to-submit bot check would silently drop
        // a subscription an agent makes right after page load, while reporting success.
        const result = await subscribeToNewsletter({ email: parsed.data.email }, signal);
        return result.ok
          ? { subscribed: true, message: "Confirmation email sent; the user must click the link in it." }
          : { subscribed: false, error: result.error };
      },
    },
  ];
}
