// Machine-readable views of published posts, served as static JSON under
// /api/posts for in-browser agents (see lib/webmcp-tools.ts).

import { allPosts, type Post } from "contentlayer/generated";
import GithubSlugger from "github-slugger";

import { postUrl } from "@/lib/seo";
import { sortPosts } from "@/lib/utils";

// Long posts are served in parts so a single tool result stays small enough
// for an agent's context window.
const PART_SIZE = 4_000;

const FENCE = /^\s*(```|~~~)/;
const HEADING = /^(#{2,3})\s+(.+?)\s*#*$/;

export const getPublishedPosts = () => sortPosts(allPosts.filter((post) => post.status === "published"));

export function toPostSummary(post: Post) {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description ?? null,
    url: postUrl(post.slug),
    publishedDate: post.publishedDate,
    lastUpdatedDate: post.lastUpdatedDate ?? null,
    tags: post.tags ?? [],
    series: post.series ? { title: post.series.title, part: post.series.order } : null,
  };
}

export function getPostIndex() {
  const posts = getPublishedPosts();
  const counts = new Map<string, number>();
  posts.flatMap((post) => post.tags ?? []).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));

  return {
    posts: posts.map(toPostSummary),
    tags: Array.from(counts, ([tag, count]) => ({ tag, count })).sort(
      (a, b) => b.count - a.count || a.tag.localeCompare(b.tag)
    ),
  };
}

export function getPostDetail(post: Post) {
  const parts = splitIntoParts(post.body.raw);
  return { ...toPostSummary(post), outline: buildOutline(parts), parts };
}

export type PostSummary = ReturnType<typeof toPostSummary>;
export type PostIndex = ReturnType<typeof getPostIndex>;
export type PostDetail = ReturnType<typeof getPostDetail>;

// Paragraph-level blocks; fenced code blocks are never split.
function splitBlocks(raw: string): string[] {
  const blocks: string[] = [];
  let current: string[] = [];
  let inFence = false;

  for (const line of raw.split("\n")) {
    if (FENCE.test(line)) inFence = !inFence;
    if (!inFence && line.trim() === "") {
      if (current.length) blocks.push(current.join("\n"));
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current.join("\n"));
  return blocks;
}

// Hard-splits a single block that is larger than a part, on line boundaries.
function splitOversized(block: string): string[] {
  if (block.length <= PART_SIZE) return [block];
  const pieces: string[] = [];
  let current = "";
  for (const line of block.split("\n")) {
    if (current && current.length + line.length + 1 > PART_SIZE) {
      pieces.push(current);
      current = "";
    }
    current = current ? `${current}\n${line}` : line;
  }
  if (current) pieces.push(current);
  return pieces;
}

function splitIntoParts(raw: string): string[] {
  const parts: string[] = [];
  let current = "";
  for (const block of splitBlocks(raw).flatMap(splitOversized)) {
    if (current && current.length + block.length + 2 > PART_SIZE) {
      parts.push(current);
      current = "";
    }
    current = current ? `${current}\n\n${block}` : block;
  }
  if (current) parts.push(current);
  return parts;
}

const plainText = (markdown: string) =>
  markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .trim();

// h2/h3 headings with the anchor ids rehype-slug generates on the rendered page,
// so an agent can deep-link with open_page("/posts/<slug>#<id>").
function buildOutline(parts: string[]) {
  const slugger = new GithubSlugger();
  const outline: { title: string; id: string; level: number; part: number }[] = [];
  let inFence = false;

  parts.forEach((content, index) => {
    for (const line of content.split("\n")) {
      if (FENCE.test(line)) inFence = !inFence;
      const match = !inFence && HEADING.exec(line);
      if (!match) continue;
      const title = plainText(match[2]);
      outline.push({ title, id: slugger.slug(title), level: match[1].length, part: index + 1 });
    }
  });
  return outline;
}
