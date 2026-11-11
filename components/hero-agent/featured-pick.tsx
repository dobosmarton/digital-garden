"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import type { HeroPick } from "@/lib/hero-agent/signals";
import { cn } from "@/lib/utils";
import { DotMatrix } from "@/components/ui/dot-matrix";
import { cellClass, CellFooter, CellHeader, cellHoverClass } from "@/components/ui/frame";

export type PickState = { status: "loading" } | { status: "failed" } | { status: "ready"; pick: HeroPick };

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const PRIVACY_NOTE = "Chosen by AI from four coarse signals. It never sees who you are.";
const FALLBACK_NOTE = "Chosen by a fixed rule while the model was unavailable.";
const LOADING_STEPS = ["Reading four visitor signals", "Ranking the posts", "Writing a one-line reason"];
const STEP_MS = 900;
const SCRAMBLE_MS = 110;
const SCRAMBLE_GLYPHS = "!?#%*/<>";

// Swaps one letter at a time for a glyph, like a status line being decoded.
function ScrambleText({ text, animated }: { text: string; animated: boolean }) {
  const [shown, setShown] = React.useState(text);

  React.useEffect(() => {
    if (!animated) return;
    const timer = setInterval(() => {
      const index = Math.floor(Math.random() * text.length);
      const glyph = SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
      setShown(/\w/.test(text[index]) ? text.slice(0, index) + glyph + text.slice(index + 1) : text);
    }, SCRAMBLE_MS);
    return () => clearInterval(timer);
  }, [text, animated]);

  return <>{animated ? shown : text}</>;
}

const cardClass = cn(cellClass, "flex min-h-60 flex-col");

function StepIcon({ state, animated }: { state: "done" | "active" | "pending"; animated: boolean }) {
  if (state === "done") return <Check className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.5} />;
  if (state === "active") {
    return (
      <span
        className={cn(
          "h-3 w-3 rounded-full border-[1.5px] border-foreground/15 border-t-accent-foreground",
          animated && "animate-spin"
        )}
      />
    );
  }
  return <span className="h-1 w-1 bg-foreground/25" />;
}

function LoadingPick({ animated }: { animated: boolean }) {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => setStep((current) => Math.min(current + 1, LOADING_STEPS.length - 1)), STEP_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={cardClass}>
      <CellHeader
        label="Picked for you"
        aside={
          <span className="flex items-center gap-2 rounded-full border border-foreground/10 px-2.5 py-0.5 text-foreground">
            <DotMatrix animated={animated} />
            <ScrambleText text="Picking..." animated={animated} />
          </span>
        }
      />
      <ol aria-hidden className="space-y-2.5 px-4 py-4">
        {LOADING_STEPS.map((label, i) => {
          const state = i < step ? "done" : i === step ? "active" : "pending";
          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-2.5 text-sm transition-colors duration-300",
                state === "active" ? "text-foreground" : "text-muted-foreground",
                state === "pending" && "opacity-50"
              )}
            >
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                <StepIcon state={state} animated={animated} />
              </span>
              {label}
            </li>
          );
        })}
      </ol>
      <CellFooter className="mt-auto">{PRIVACY_NOTE}</CellFooter>
      <span className="sr-only">Picking a post for you</span>
    </div>
  );
}

export function FeaturedPick({ state, reducedMotion }: { state: PickState; reducedMotion: boolean }) {
  if (state.status === "failed") return null;
  if (state.status === "loading") return <LoadingPick animated={!reducedMotion} />;

  const { pick } = state;
  return (
    <Link
      href={pick.href}
      data-detect="recommended-post"
      className={cn(
        cardClass,
        cellHoverClass,
        "group animate-in fade-in-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
      )}
    >
      <CellHeader
        label="Picked for you"
        aside={
          <>
            <DotMatrix />
            {pick.readMinutes} min read
          </>
        }
      />
      <div className="px-4 py-4">
        <p className="font-heading text-lg leading-snug font-bold transition-colors group-hover:text-accent-foreground">
          {pick.title}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">{capitalize(pick.reason)}</p>
        <p className="mt-3 flex items-center gap-1 text-sm text-accent-foreground">
          Read the post
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
      <CellFooter className="mt-auto">{pick.source === "model" ? PRIVACY_NOTE : FALLBACK_NOTE}</CellFooter>
    </Link>
  );
}
