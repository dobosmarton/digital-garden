import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Post } from "contentlayer/generated";
import { z } from "zod";

import type { HeroPick, Signals } from "@/lib/hero-agent/signals";
import { getPublishedPosts } from "@/lib/post-api";

const MODEL = "claude-haiku-5-5";
// Timeouts are retried, so a visitor on a cold cache waits at most about twice this.
const MODEL_TIMEOUT_MS = 3_500;
const MAX_REASON_CHARS = 110;

const INSTRUCTIONS = `You choose posts for a small agent on the home page of Marton's blog, which is about software engineering and building with AI.
You never see the visitor. You only get four coarse signals: where they came from, their local time of day, their device, and whether they visited before.
Pick the one published post most worth this visitor's time.

Guidance:
- Prefer part 1 of a series for first visits; returning visitors may be ready for a later part or something they likely missed.
- Long reads suit desktop and evenings; shorter reads suit mobile.
- Visitors from news aggregators or code hosts tend to like deep technical posts; visitors from AI assistants were probably looking for something specific about AI.

Write the reason as one plain line of at most 90 characters, lowercase, in the voice of an agent log, about the visitor in the third person.
Example: "late evening reader from hacker news: the deepest rabbit hole here"
No em dashes, no emojis, no hype words.`;

const toCandidate = (post: Post) => ({
  slug: post.slug,
  title: post.title,
  description: post.description ?? "",
  tags: post.tags ?? [],
  series: post.series ? `${post.series.title}, part ${post.series.order}` : null,
  published: post.publishedDate,
  readMinutes: post.readTimeMinutes,
});

const tidyReason = (reason: string) =>
  reason
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_REASON_CHARS);

function toPick(post: Post, reason: string, source: HeroPick["source"]): HeroPick {
  return {
    slug: post.slug,
    title: post.title,
    href: `/posts/${post.slug}`,
    readMinutes: post.readTimeMinutes,
    reason: tidyReason(reason),
    source,
  };
}

// Deterministic choice used when the model is unavailable. Posts arrive newest first.
function fallbackPick(posts: Post[], signals: Signals): HeroPick {
  const recent = posts.slice(0, 5);
  const byLength = [...recent].sort((a, b) => a.readTimeMinutes - b.readTimeMinutes);

  if (signals.device === "mobile") {
    return toPick(byLength[0], "small screen: the shortest recent read", "fallback");
  }
  if (signals.from === "news" || signals.from === "code") {
    return toPick(byLength[byLength.length - 1], "deep-dive crowd: the longest recent read", "fallback");
  }
  if (signals.visit === "returning" && posts.length > 1) {
    return toPick(posts[1], "returning visitor: probably saw the newest, so the one before it", "fallback");
  }
  const seriesStart = posts.find((post) => post.series?.order === 1);
  if (seriesStart) {
    return toPick(seriesStart, "first visit: the start of the newest series", "fallback");
  }
  return toPick(posts[0], "first visit: start with the newest post", "fallback");
}

export async function pickPost(signals: Signals): Promise<HeroPick> {
  const posts = getPublishedPosts();
  const slugs = posts.map((post) => post.slug);
  if (slugs.length === 0) throw new Error("No published posts to pick from");

  try {
    // Created per call so a missing ANTHROPIC_API_KEY lands in the fallback below.
    const client = new Anthropic({ timeout: MODEL_TIMEOUT_MS, maxRetries: 1 });
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 1024,
      system: INSTRUCTIONS,
      messages: [{ role: "user", content: JSON.stringify({ visitor: signals, posts: posts.map(toCandidate) }) }],
      output_config: {
        effort: "low",
        format: zodOutputFormat(
          z.object({
            slug: z.enum(slugs as [string, ...string[]]),
            reason: z.string(),
          })
        ),
      },
    });
    // parsed_output is null on a refusal or an answer that fails the schema.
    const output = response.parsed_output;
    const post = output && posts.find((candidate) => candidate.slug === output.slug);
    if (post && output.reason.trim()) return toPick(post, output.reason, "model");
    console.warn("Hero pick model returned no usable pick", response.stop_reason);
  } catch (error) {
    console.warn("Hero pick model call failed", error instanceof Error ? error.name : "unknown");
  }

  return fallbackPick(posts, signals);
}
