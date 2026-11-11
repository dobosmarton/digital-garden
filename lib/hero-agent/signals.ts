// Coarse visitor signals for the home page agent. Each is a small enum, so nothing
// here identifies a visitor: the referrer becomes a category, the clock a daypart.
// Shared by the browser (to read them) and the /api/hero-pick route (to validate them).

export const SOURCES = ["direct", "search", "ai", "social", "news", "code", "other"] as const;
export const DAYPARTS = ["morning", "afternoon", "evening", "night"] as const;
export const DEVICES = ["desktop", "mobile"] as const;
export const VISITS = ["first", "returning"] as const;

export type Signals = {
  from: (typeof SOURCES)[number];
  time: (typeof DAYPARTS)[number];
  device: (typeof DEVICES)[number];
  visit: (typeof VISITS)[number];
};

export type HeroPick = {
  slug: string;
  title: string;
  href: string;
  readMinutes: number;
  reason: string;
  // "fallback" means the model was unavailable and a fixed rule chose the post.
  source: "model" | "fallback";
};

// One canonical spelling per combination, so the CDN caches each combination once.
export const toQuery = (signals: Signals) =>
  `from=${signals.from}&time=${signals.time}&device=${signals.device}&visit=${signals.visit}`;

const SOURCE_HOSTS: ReadonlyArray<[Signals["from"], RegExp]> = [
  ["ai", /(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/],
  ["search", /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|kagi\.com|ecosia\.org|search\.brave\.com|yahoo\.com)$/],
  ["news", /(^|\.)(news\.ycombinator\.com|lobste\.rs|reddit\.com|daily\.dev|dev\.to)$/],
  [
    "social",
    /(^|\.)(x\.com|twitter\.com|t\.co|linkedin\.com|lnkd\.in|bsky\.app|threads\.net|facebook\.com|mastodon\.[a-z.]+)$/,
  ],
  ["code", /(^|\.)(github\.com|gitlab\.com|stackoverflow\.com)$/],
];

function sourceOf(referrer: string, ownHost: string): Signals["from"] {
  if (!referrer) return "direct";
  let host: string;
  try {
    host = new URL(referrer).hostname;
  } catch {
    return "other";
  }
  if (host === ownHost) return "direct";
  return SOURCE_HOSTS.find(([, pattern]) => pattern.test(host))?.[0] ?? "other";
}

function daypartOf(hour: number): Signals["time"] {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

const VISITED_KEY = "hero-agent:visited";

// Storage can be blocked (private mode, disabled site data); treat that as a first visit.
function markVisit(): Signals["visit"] {
  try {
    const seen = window.localStorage.getItem(VISITED_KEY) !== null;
    window.localStorage.setItem(VISITED_KEY, "1");
    return seen ? "returning" : "first";
  } catch {
    return "first";
  }
}

// Browser only.
export function readSignals(): Signals {
  return {
    from: sourceOf(document.referrer, window.location.hostname),
    time: daypartOf(new Date().getHours()),
    device: window.matchMedia("(pointer: coarse)").matches ? "mobile" : "desktop",
    visit: markVisit(),
  };
}
