import { NextResponse } from "next/server";

import { getPostIndex } from "@/lib/post-api";

// Static index of published posts and tags for in-browser agents (WebMCP).
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(getPostIndex());
}
