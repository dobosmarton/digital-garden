import { RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { ArtifactFrame } from "@/components/ui/artifact-frame";

// A top-to-bottom sequence of steps for MDX posts, each tagged with who acts at that step.
// Steps where the reader (the human) acts get the accent color, so the hand-offs stand out.
// A vertical stepper keeps every note on one or two lines, at any width. Server component.

type Actor = "you" | "agent";

type Step = { label: string; actor: Actor; note: string };

type FlowStepsProps = {
  title: string;
  caption?: string;
  steps: Step[];
  // An optional note about a step that loops back, shown under the list.
  loop?: string;
};

export function FlowSteps({ title, caption, steps, loop }: FlowStepsProps) {
  return (
    <ArtifactFrame label={title} meta={`${steps.length} steps`} caption={caption}>
      <figure className="not-prose font-sans" aria-label={title}>
        <ol className="relative my-0! list-none p-0!">
          {steps.map((step, i) => {
            const you = step.actor === "you";
            return (
              <li
                key={step.label}
                className="relative my-0! grid grid-cols-[1.75rem_1fr] gap-x-3 p-0! pb-4! last:pb-0!"
              >
                {i < steps.length - 1 && (
                  <span aria-hidden className="absolute top-7 bottom-0 left-[0.875rem] w-px bg-foreground/15" />
                )}
                <span
                  className={cn(
                    "relative flex size-7 items-center justify-center rounded-md border font-mono text-[11px] tabular-nums",
                    you
                      ? "border-accent-foreground/50 bg-accent-foreground/10 text-accent-foreground"
                      : "border-foreground/20 text-muted-foreground"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="pt-0.5">
                  <p className="my-0! flex flex-wrap items-baseline gap-x-2 text-sm font-medium text-foreground">
                    {step.label}
                    <span
                      className={cn(
                        "font-mono text-[10px] font-normal tracking-wider whitespace-nowrap uppercase",
                        you ? "text-accent-foreground" : "text-muted-foreground"
                      )}
                    >
                      {you ? "[ You ]" : "[ Agent ]"}
                    </span>
                  </p>
                  <p className="mt-0.5! mb-0! text-sm leading-snug text-muted-foreground">{step.note}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {loop && (
          <p className="mt-4! mb-0! flex items-center gap-1.5 border-t border-foreground/10 pt-3 text-xs text-muted-foreground">
            <RotateCcw aria-hidden className="h-3.5 w-3.5 shrink-0" />
            {loop}
          </p>
        )}
      </figure>
    </ArtifactFrame>
  );
}
