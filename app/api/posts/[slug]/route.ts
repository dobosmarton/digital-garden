import { NextResponse } from "next/server";

import { getPostDetail, getPublishedPosts } from "@/lib/post-api";

// A published post as raw MDX split into parts, plus its outline, for
// in-browser agents (WebMCP `get_post`).
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedPosts().map((post) => ({ slug: post.slug }));
}

export function GET(_request: Request, { params }: { params: { slug: string } }) {
  const post = getPublishedPosts().find((p) => p.slug === params.slug);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  return NextResponse.json(getPostDetail(post));
}
