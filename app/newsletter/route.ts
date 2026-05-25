import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";

export const runtime = "nodejs";

const BUTTONDOWN_URL = "https://api.buttondown.com/v1/subscribers";
const MAX_BODY_BYTES = 1024;

const MIN_SUBMIT_MS = 2_000;

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  company: z.string().optional(),
  elapsedMs: z.number().nonnegative().optional(),
});

const redisUrl = process.env.UPSTASH_KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const ratelimit =
  redisUrl && redisToken
    ? new Ratelimit({
        redis: new Redis({ url: redisUrl, token: redisToken }),
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        analytics: true,
        prefix: "newsletter",
      })
    : null;

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  if (ratelimit) {
    const ip = clientIp(request);
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let parsed;
  try {
    parsed = bodySchema.safeParse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  if (parsed.data.company && parsed.data.company.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (parsed.data.elapsedMs !== undefined && parsed.data.elapsedMs < MIN_SUBMIT_MS) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    console.error("BUTTONDOWN_API_KEY is not set");
    return NextResponse.json({ error: "Newsletter is not configured." }, { status: 500 });
  }

  try {
    const res = await fetch(BUTTONDOWN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${apiKey}`,
        "X-Buttondown-Collision-Behavior": "overwrite",
      },
      body: JSON.stringify({
        email_address: parsed.data.email,
        tags: ["website"],
      }),
    });

    if (res.ok) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    console.error("Buttondown subscribe failed", res.status);
    return NextResponse.json({ error: "Subscription failed. Please try again." }, { status: 502 });
  } catch (error) {
    console.error("Buttondown subscribe threw", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Subscription failed. Please try again." }, { status: 500 });
  }
}
