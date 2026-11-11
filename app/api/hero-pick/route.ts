import { NextResponse } from "next/server";
import { z } from "zod";

import { pickPost } from "@/lib/hero-agent/pick";
import { DAYPARTS, DEVICES, SOURCES, toQuery, VISITS } from "@/lib/hero-agent/signals";

const querySchema = z.strictObject({
  from: z.enum(SOURCES),
  time: z.enum(DAYPARTS),
  device: z.enum(DEVICES),
  visit: z.enum(VISITS),
});

// Model picks stay cached for 12 hours per signal combination. Fallback picks expire
// quickly so the model gets another chance soon after an outage.
const MODEL_CACHE = "public, s-maxage=43200, stale-while-revalidate=86400";
const FALLBACK_CACHE = "public, s-maxage=300";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));

  // Only the canonical query string is accepted, so there are at most 112 cacheable URLs
  // and the model runs at most once per combination per cache window.
  if (!parsed.success || url.search.slice(1) !== toQuery(parsed.data)) {
    return NextResponse.json({ error: "Invalid signals" }, { status: 400 });
  }

  const pick = await pickPost(parsed.data);
  return NextResponse.json(pick, {
    headers: { "Cache-Control": pick.source === "model" ? MODEL_CACHE : FALLBACK_CACHE },
  });
}
