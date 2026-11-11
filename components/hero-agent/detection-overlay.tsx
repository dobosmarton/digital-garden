"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { Corners } from "@/components/ui/frame";

export type DetectionTarget = {
  label: string;
  selector: string;
  confidence: number;
  // false: no frame at rest, only the reticle on hover. For calls to action that need to stay clean.
  resting?: boolean;
  // Put the label under the box when the space above it holds text the label would cover.
  labelBelow?: boolean;
};

export type DetectionEvent =
  | { type: "lock"; label: string; confidence: string; name?: string }
  | { type: "dwell"; label: string }
  | { type: "track"; state: "found" | "lost"; confidence: string };

export type FocusRequest = { label: string; until: number };

type Rect = { x: number; y: number; w: number; h: number };

// A box the reticle can lock onto: a fixed target, or a hovered `data-detect-item` element.
type Candidate = {
  el: Element;
  rect: Rect;
  label: string;
  name?: string;
  confidence: number;
  labelBelow?: boolean;
};

type DetectionOverlayProps = {
  root: HTMLElement;
  targets: DetectionTarget[];
  reducedMotion: boolean;
  // Written by the parent: a target to hold the reticle on, and per-label confidence bonuses.
  focusRef: React.RefObject<FocusRequest | null>;
  boostRef: React.RefObject<Record<string, number>>;
  frameRef: React.RefObject<HTMLSpanElement | null>;
  onEvent: (event: DetectionEvent) => void;
};

const PAD = 6;
const RETICLE_PAD = 3;
const ATTENTION_RADIUS = 140;
const POINTER_IDLE_MS = 2_500;
const SCAN_MS = 1_800;
const LOCK_LOG_MS = 450;
const DWELL_MS = 1_400;
const CONFIDENCE_MS = 250;
const BOX_STAGGER_FRAMES = 8;
const CURSOR_SIZE = 28;
const LABEL_GAP = 6;
const LABEL_HEIGHT = 14;
// Repeated elements (post cards) are detected on hover only, so they get no resting frames.
const ITEM_SELECTOR = "[data-detect-item]";
const ITEM_CONFIDENCE = 0.9;
// One accent for everything the detector draws: the site's link blue.
const ACCENT = "hsl(var(--accent-foreground))";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const displayName = (label: string) => `[ ${label.replaceAll("_", " ")} ]`;

function place(el: HTMLElement, rect: Rect) {
  el.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
  el.style.width = `${rect.w}px`;
  el.style.height = `${rect.h}px`;
}

function placeLabel(label: HTMLElement, below: boolean) {
  label.style.top = below ? `calc(100% + ${LABEL_GAP}px)` : `-${LABEL_HEIGHT + LABEL_GAP}px`;
}

function distanceToRect(px: number, py: number, rect: Rect) {
  const dx = Math.max(rect.x - px, 0, px - (rect.x + rect.w));
  const dy = Math.max(rect.y - py, 0, py - (rect.y + rect.h));
  return Math.hypot(dx, dy);
}

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0c.4 6.9 1.9 10.6 12 12-10.1 1.4-11.6 5.1-12 12-.4-6.9-1.9-10.6-12-12C10.1 10.6 11.6 6.9 12 0z" />
    </svg>
  );
}

const labelClass =
  "absolute left-0 flex items-center gap-1.5 font-mono text-[10px] leading-[14px] tracking-wider whitespace-nowrap uppercase";

// Draws detector frames over real elements inside `root`. Everything per frame is written
// straight to the DOM, so React only renders the overlay once.
export function DetectionOverlay({
  root,
  targets,
  reducedMotion,
  focusRef,
  boostRef,
  frameRef,
  onEvent,
}: DetectionOverlayProps) {
  const boxRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const reticleRef = React.useRef<HTMLDivElement>(null);
  const reticleLabelRef = React.useRef<HTMLSpanElement>(null);
  const reticleNameRef = React.useRef<HTMLSpanElement>(null);
  const reticleConfidenceRef = React.useRef<HTMLSpanElement>(null);
  const cursorRef = React.useRef<HTMLDivElement>(null);
  const emit = React.useEffectEvent(onEvent);

  React.useEffect(() => {
    const reticle = reticleRef.current;
    const reticleLabel = reticleLabelRef.current;
    const reticleName = reticleNameRef.current;
    const reticleConfidence = reticleConfidenceRef.current;
    const cursor = cursorRef.current;
    if (!reticle || !reticleLabel || !reticleName || !reticleConfidence || !cursor) return;

    const elements: (Element | null)[] = targets.map(() => null);
    const pointer = { clientX: 0, clientY: 0, inside: false, lastMove: 0, speed: 0, item: null as Element | null };
    const trail = { x: 0, y: 0, shown: false };
    let frame = 0;
    let raf = 0;
    let visible = true;
    let lock: Candidate | null = null;
    let lockSince = 0;
    let lockLogged = false;
    let scanIndex = -1;
    let scanAt = 0;
    let confidenceAt = 0;
    let lockConfidence = "";
    const dwelled = new Set<string>();

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const now = performance.now();
      const dt = Math.max(now - pointer.lastMove, 1);
      const distance = Math.hypot(event.clientX - pointer.clientX, event.clientY - pointer.clientY);
      pointer.speed = pointer.inside ? clamp(distance / dt, 0, 10) : 0;
      pointer.clientX = event.clientX;
      pointer.clientY = event.clientY;
      pointer.lastMove = now;
      pointer.inside = true;
      pointer.item = event.target instanceof Element ? event.target.closest(ITEM_SELECTOR) : null;
    };
    const onPointerLeave = () => {
      pointer.inside = false;
      pointer.item = null;
    };

    const tick = () => {
      frame++;
      const now = performance.now();
      const rootRect = root.getBoundingClientRect();
      const toRect = (el: Element): Rect | null => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return null;
        return {
          x: r.left - rootRect.left - PAD,
          y: r.top - rootRect.top - PAD,
          w: r.width + PAD * 2,
          h: r.height + PAD * 2,
        };
      };
      const inViewport = (rect: Rect) => rect.y + rect.h > -rootRect.top && rect.y < window.innerHeight - rootRect.top;

      const candidates = targets.map((target, i): Candidate | null => {
        if (!elements[i]?.isConnected) elements[i] = root.querySelector(target.selector);
        const el = elements[i];
        const rect = el && toRect(el);
        return el && rect
          ? { el, rect, label: target.label, confidence: target.confidence, labelBelow: target.labelBelow }
          : null;
      });

      candidates.forEach((candidate, i) => {
        const box = boxRefs.current[i];
        if (!box) return;
        const appeared = reducedMotion || frame > i * BOX_STAGGER_FRAMES;
        box.style.opacity = candidate && appeared ? "1" : "0";
        if (candidate) place(box, candidate.rect);
      });

      const px = pointer.clientX - rootRect.left;
      const py = pointer.clientY - rootRect.top;
      const pointerLive = pointer.inside && now - pointer.lastMove < POINTER_IDLE_MS;

      const focus = focusRef.current;
      const forced = focus && focus.until > now ? candidates.find((c) => c?.label === focus.label) : null;
      const item = pointer.item?.isConnected ? pointer.item : null;
      const itemRect = item && toRect(item);

      let next: Candidate | null = null;
      if (forced) {
        next = forced;
      } else if (pointerLive && item && itemRect) {
        next = {
          el: item,
          rect: itemRect,
          label: item.getAttribute("data-detect-item") ?? "object",
          name: item.getAttribute("data-detect-name") ?? undefined,
          confidence: ITEM_CONFIDENCE,
        };
      } else if (pointerLive) {
        // Nearest box within reach wins; when the pointer is inside several, the smallest does.
        let bestDistance = ATTENTION_RADIUS;
        let bestArea = Infinity;
        for (const candidate of candidates) {
          if (!candidate) continue;
          const distance = distanceToRect(px, py, candidate.rect);
          const area = candidate.rect.w * candidate.rect.h;
          if (distance < bestDistance || (distance === bestDistance && area < bestArea)) {
            bestDistance = distance;
            bestArea = area;
            next = candidate;
          }
        }
      } else if (!reducedMotion) {
        // Idle: cycle through the targets that are on screen.
        const scannable = (index: number) => {
          const candidate = candidates[index];
          return candidate && inViewport(candidate.rect);
        };
        if (now - scanAt > SCAN_MS || !scannable(scanIndex)) {
          scanAt = now;
          const from = scanIndex;
          scanIndex = -1;
          for (let step = 1; step <= candidates.length; step++) {
            const index = (from + step + candidates.length) % candidates.length;
            if (scannable(index)) {
              scanIndex = index;
              break;
            }
          }
        }
        next = scanIndex >= 0 ? candidates[scanIndex] : null;
      }

      if (next?.el !== lock?.el) {
        lockSince = now;
        lockLogged = false;
        confidenceAt = 0;
        if (next) {
          reticleName.textContent = displayName(next.label);
          placeLabel(reticleLabel, next.labelBelow ?? false);
        }
      }
      lock = next;

      if (lock && now - confidenceAt > CONFIDENCE_MS) {
        confidenceAt = now;
        const noise = reducedMotion ? 0 : (Math.random() - 0.5) * 0.03;
        const bonus = boostRef.current[lock.label] ?? 0;
        lockConfidence = clamp(lock.confidence + bonus + noise, 0.3, 0.99).toFixed(2);
        reticleConfidence.textContent = lockConfidence;
      }

      if (lock) {
        place(reticle, {
          x: lock.rect.x - RETICLE_PAD,
          y: lock.rect.y - RETICLE_PAD,
          w: lock.rect.w + RETICLE_PAD * 2,
          h: lock.rect.h + RETICLE_PAD * 2,
        });
        reticle.style.opacity = "1";
      } else {
        reticle.style.opacity = "0";
      }

      if (pointerLive && lock && !forced) {
        if (!lockLogged && now - lockSince > LOCK_LOG_MS) {
          lockLogged = true;
          emit({ type: "lock", label: lock.label, confidence: lockConfidence, name: lock.name });
        }
        if (!dwelled.has(lock.label) && now - lockSince > DWELL_MS) {
          dwelled.add(lock.label);
          emit({ type: "dwell", label: lock.label });
        }
      }

      const showCursor = pointer.inside && !reducedMotion;
      const cursorConfidence = clamp(0.8 - pointer.speed * 0.12, 0.38, 0.8).toFixed(2);
      if (showCursor) {
        if (!trail.shown) {
          trail.x = px;
          trail.y = py;
        }
        trail.x += (px - trail.x) * 0.3;
        trail.y += (py - trail.y) * 0.3;
        pointer.speed *= 0.92;
        place(cursor, {
          x: trail.x - CURSOR_SIZE / 2,
          y: trail.y - CURSOR_SIZE / 2,
          w: CURSOR_SIZE,
          h: CURSOR_SIZE,
        });
      }
      if (showCursor !== trail.shown) {
        trail.shown = showCursor;
        cursor.style.opacity = showCursor ? "1" : "0";
        emit({ type: "track", state: showCursor ? "found" : "lost", confidence: cursorConfidence });
      }

      if (frame % 6 === 0 && frameRef.current) {
        frameRef.current.textContent = String(frame).padStart(4, "0");
      }

      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    observer.observe(root);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      observer.disconnect();
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [root, targets, reducedMotion, focusRef, boostRef, frameRef]);

  const snap =
    !reducedMotion && "transition-[transform,width,height,opacity] duration-300 ease-[cubic-bezier(.2,.9,.3,1)]";

  return createPortal(
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-visible select-none print:hidden">
      {targets.map((target, i) =>
        target.resting === false ? null : (
          <div
            key={target.label}
            ref={(el) => {
              boxRefs.current[i] = el;
            }}
            className="absolute top-0 left-0 rounded-md border border-foreground/[0.07] text-foreground/25 opacity-0 transition-opacity duration-700"
          >
            <Corners />
          </div>
        )
      )}
      <div
        ref={reticleRef}
        className={cn("absolute top-0 left-0 rounded-md border opacity-0", snap)}
        style={{ borderColor: `color-mix(in oklab, ${ACCENT} 45%, transparent)`, color: ACCENT }}
      >
        <Corners />
        <span ref={reticleLabelRef} className={labelClass} style={{ top: `-${LABEL_HEIGHT + LABEL_GAP}px` }}>
          <span ref={reticleNameRef} className="text-muted-foreground" />
          <span ref={reticleConfidenceRef} className="tabular-nums" />
        </span>
      </div>
      <div ref={cursorRef} className="absolute top-0 left-0 opacity-0 transition-opacity duration-300">
        <div
          className="flex h-full w-full items-center justify-center rounded-full border border-foreground/15 bg-background/50"
          style={{ color: ACCENT }}
        >
          <Star className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>,
    root
  );
}
