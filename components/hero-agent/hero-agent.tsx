"use client";

import * as React from "react";

import { readSignals, toQuery, type HeroPick, type Signals } from "@/lib/hero-agent/signals";
import { cn } from "@/lib/utils";
import {
  DetectionOverlay,
  type DetectionEvent,
  type DetectionTarget,
  type FocusRequest,
} from "@/components/hero-agent/detection-overlay";
import { FeaturedPick, type PickState } from "@/components/hero-agent/featured-pick";
import { createLogStore, type LogEntry, type LogTag } from "@/components/hero-agent/log-store";

// Selectors resolve inside the element marked `data-hero-root`.
const TARGETS: DetectionTarget[] = [
  { label: "headline", selector: "[data-detect=headline]", confidence: 0.97 },
  // Resting marks on the headline only: the subtitle's would stack against the headline's.
  { label: "subtitle", selector: "[data-detect=subtitle]", confidence: 0.84, resting: false, labelPlacement: "below" },
  { label: "email_field", selector: "input[type=email]", confidence: 0.91, resting: false, labelPlacement: "inside" },
  {
    label: "subscribe_cta",
    selector: "button[type=submit]",
    confidence: 0.88,
    resting: false,
    labelPlacement: "below",
  },
  // Already framed by their own borders, so no resting frame on top.
  { label: "agent_log", selector: "[data-detect=agent-log]", confidence: 0.99, resting: false },
  {
    label: "recommended_post",
    selector: "[data-detect=recommended-post]",
    confidence: 0.93,
    resting: false,
    labelPlacement: "below",
  },
];

const HYPOTHESES: Record<string, string> = {
  headline: "reading the headline. it is short, they will finish",
  subtitle: "still reading. promising",
  email_field: "considering the newsletter. not pushing it",
  subscribe_cta: "one click from subscribing. holding very still",
  agent_log: "visitor is watching me watch them",
  recommended_post: "the pick landed. confidence +0.04",
  post_preview: "skimming the archive. maybe the pick was wrong",
};

const TAG_COLORS: Record<LogTag, string> = {
  observe: "text-zinc-400",
  detect: "text-sky-400",
  reason: "text-fuchsia-400",
  act: "text-emerald-400",
};

const MAX_LINES = 9;
const MOBILE_LINES = 5;
const DETECT_LOG_INTERVAL_MS = 1_500;
const TRACK_LOG_INTERVAL_MS = 8_000;
const HIGHLIGHT_MS = 2_200;
const EMPTY_LOG: LogEntry[] = [];

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const useReducedMotion = () =>
  React.useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  );

function formatClock(ms: number) {
  const seconds = ms / 1000;
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${(seconds % 60).toFixed(1).padStart(4, "0")}`;
}

function LogLine({ entry, isLast, className }: { entry: LogEntry; isLast: boolean; className?: string }) {
  return (
    <div className={cn("gap-x-2 leading-relaxed", className)}>
      <span className="hidden shrink-0 text-zinc-600 tabular-nums sm:inline">{formatClock(entry.atMs)}</span>
      <p className="min-w-0">
        <span className={TAG_COLORS[entry.tag]}>[{entry.tag}]</span>{" "}
        <span className="text-zinc-200">{entry.text.slice(0, entry.shown)}</span>
        {isLast && <span className="ml-0.5 inline-block animate-pulse text-emerald-400">▌</span>}
      </p>
    </div>
  );
}

// The home page hero agent: a detector draws boxes over the hero, a log narrates what it
// sees, and a small model behind /api/hero-pick recommends one post.
export function HeroAgent() {
  const reducedMotion = useReducedMotion();
  const [store] = React.useState(() => createLogStore(MAX_LINES));
  const entries = React.useSyncExternalStore(store.subscribe, store.getSnapshot, () => EMPTY_LOG);
  const [root, setRoot] = React.useState<HTMLElement | null>(null);
  const [pick, setPick] = React.useState<PickState>({ status: "loading" });

  const signalsRef = React.useRef<Signals | null>(null);
  const focusRef = React.useRef<FocusRequest | null>(null);
  const boostRef = React.useRef<Record<string, number>>({});
  const frameRef = React.useRef<HTMLSpanElement>(null);
  const lastLogAt = React.useRef({ detect: 0, track: 0 });

  const anchorRef = React.useCallback((el: HTMLDivElement | null) => {
    setRoot(el?.closest<HTMLElement>("[data-hero-root]") ?? null);
  }, []);

  React.useEffect(() => {
    // Read once per mount: reading marks the visit, so a second read would say "returning".
    signalsRef.current ??= readSignals();
    const signals = signalsRef.current;
    const controller = new AbortController();
    const startedAt = performance.now();

    store.setInstant(reducedMotion);
    store.push("observe", `frame 0001 · ${window.innerWidth}×${window.innerHeight} · ${TARGETS.length - 1} objects`);
    store.push("detect", "headline 0.97 · email_field 0.91 · subscribe_cta 0.88");
    store.push(
      "observe",
      `signals: from=${signals.from} time=${signals.time} device=${signals.device} visit=${signals.visit}`
    );
    store.push("reason", "goal: pick one post worth this visitor's time");

    fetch(`/api/hero-pick?${toQuery(signals)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<HeroPick>;
      })
      .then((result) => {
        const elapsed = Math.round(performance.now() - startedAt);
        if (result.source === "model") store.push("reason", `model replied in ${elapsed}ms`);
        else store.push("act", "model unavailable. fallback rule picked instead");
        store.push("reason", `pick: "${result.title}"`);
        store.push("reason", `why: ${result.reason}`);
        store.push("act", "highlight recommended_post", {
          onStart: () => {
            setPick({ status: "ready", pick: result });
            focusRef.current = { label: "recommended_post", until: performance.now() + HIGHLIGHT_MS };
          },
        });
        store.push("observe", "idle. watching for input");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        store.push("act", "pick request failed. standing down");
        setPick({ status: "failed" });
      });

    return () => {
      controller.abort();
      store.reset();
    };
  }, [store, reducedMotion]);

  // Typing in the email field is noticed, never read.
  React.useEffect(() => {
    if (!root) return;
    let noticed = false;
    const onFocusIn = (event: FocusEvent) => {
      if (noticed || !(event.target instanceof HTMLInputElement) || event.target.type !== "email") return;
      noticed = true;
      store.push("detect", "keystrokes in email_field. not reading them", { live: true });
    };
    root.addEventListener("focusin", onFocusIn);
    return () => root.removeEventListener("focusin", onFocusIn);
  }, [root, store]);

  const onDetection = (event: DetectionEvent) => {
    const now = performance.now();
    if (event.type === "lock") {
      if (now - lastLogAt.current.detect < DETECT_LOG_INTERVAL_MS) return;
      lastLogAt.current.detect = now;
      const name = event.name ? ` · "${event.name}"` : "";
      store.push("detect", `${event.label} ${event.confidence}${name}`, { live: true });
    } else if (event.type === "dwell") {
      const hypothesis = HYPOTHESES[event.label];
      if (hypothesis) store.push("reason", `hypothesis: ${hypothesis}`, { live: true });
      if (event.label === "recommended_post") boostRef.current.recommended_post = 0.04;
    } else {
      if (now - lastLogAt.current.track < TRACK_LOG_INTERVAL_MS) return;
      lastLogAt.current.track = now;
      store.push(
        "detect",
        event.state === "found"
          ? `human_cursor ${event.confidence} · new track`
          : "human_cursor lost · holding last position",
        { live: true }
      );
    }
  };

  return (
    <div ref={anchorRef} className="flex w-full flex-col gap-4">
      <div
        data-detect="agent-log"
        className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 font-mono text-[13px] shadow-2xl select-none"
      >
        <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-500">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-zinc-300">vision-agent</span>
          <span className="hidden sm:inline">watching this page</span>
          <span className="ml-auto tabular-nums">
            frame <span ref={frameRef}>0000</span>
          </span>
        </div>
        <div
          aria-hidden
          className="flex h-38 flex-col justify-end gap-1 overflow-hidden mask-[linear-gradient(to_bottom,transparent,black_2.5rem)] px-4 py-3 sm:h-64"
        >
          {entries.map((entry, i) => (
            <LogLine
              key={entry.id}
              entry={entry}
              isLast={i === entries.length - 1}
              className={i < entries.length - MOBILE_LINES ? "hidden sm:flex" : "flex"}
            />
          ))}
        </div>
      </div>
      <div aria-live="polite">
        <FeaturedPick state={pick} reducedMotion={reducedMotion} />
      </div>
      {root && (
        <DetectionOverlay
          root={root}
          targets={TARGETS}
          reducedMotion={reducedMotion}
          focusRef={focusRef}
          boostRef={boostRef}
          frameRef={frameRef}
          onEvent={onDetection}
        />
      )}
    </div>
  );
}
