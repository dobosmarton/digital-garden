import { cn } from "@/lib/utils";
import { ArtifactFrame } from "@/components/ui/artifact-frame";

// A model's tool loop for MDX posts, as a waterfall on one time axis. Each row is one call:
// a long bar for the wait while the model decides it, then a short mark where the call runs.
// The rows follow each other, so the axis shows how the turn's time adds up. Server
// component: plain divs, no chart library.

type Step = {
  // What happens, in plain words.
  label: string;
  // The tool behind it, shown small under the label. Omitted for the final answer.
  tool?: string;
  // Bundles a multi-step sequence into one call.
  composite?: boolean;
  // When this step's decision arrives, in seconds from the start of the turn.
  at: number;
};

type ToolTraceProps = {
  title: string;
  caption?: string;
  steps: Step[];
  legend: { wait: string; run: string };
  tickEvery?: number;
  // Shown in the label next to the call count, e.g. "max 7".
  limit?: number;
};

const waitColor = "color-mix(in oklab, var(--chart-1) var(--chart-light-mix), hsl(var(--background)))";
const runColor = "var(--chart-1)";

// Label column, then the time track. The column narrows on phones.
const rowGrid = "grid grid-cols-[7.5rem_1fr] items-center gap-3 sm:grid-cols-[13rem_1fr]";

export function ToolTrace({ title, caption, steps, legend, tickEvery = 5, limit }: ToolTraceProps) {
  const end = Math.max(...steps.map((step) => step.at));
  const scaleMax = Math.ceil(end / tickEvery) * tickEvery;
  const ticks = Array.from({ length: scaleMax / tickEvery + 1 }, (_, i) => i * tickEvery);
  const percent = (seconds: number) => `${(seconds / scaleMax) * 100}%`;
  const calls = steps.filter((step) => step.tool).length;
  const meta = limit ? `${calls} of max ${limit} calls` : `${calls} calls`;

  return (
    <ArtifactFrame label={title} meta={meta} caption={caption}>
      <figure className="not-prose pr-4 font-sans" role="img" aria-label={title}>
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-4 rounded-sm" style={{ background: waitColor }} />
            {legend.wait}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-1 rounded-sm" style={{ background: runColor }} />
            {legend.run}
          </span>
        </div>
        <div className="space-y-2">
          {steps.map((step, i) => {
            const from = i === 0 ? 0 : steps[i - 1].at;
            return (
              <div key={step.label} className={rowGrid}>
                <div className="min-w-0">
                  <p className="my-0! text-sm leading-5 text-foreground">{step.label}</p>
                  {step.tool && (
                    <p className="my-0! font-mono text-[11px] leading-4 text-muted-foreground">
                      {step.tool}
                      {step.composite && <span className="whitespace-nowrap"> · composite</span>}
                    </p>
                  )}
                </div>
                <div className="relative h-5">
                  <span
                    className={cn("absolute inset-y-0 rounded-l-sm", !step.tool && "rounded-r-sm")}
                    style={{ left: percent(from), width: percent(step.at - from), background: waitColor }}
                  />
                  {step.tool && (
                    <span
                      className="absolute inset-y-0 w-1 rounded-r-sm"
                      style={{ left: percent(step.at), background: runColor }}
                    />
                  )}
                </div>
              </div>
            );
          })}
          <div className={rowGrid}>
            <span />
            <div className="relative h-5 border-t border-foreground/10">
              {ticks.map((tick, i) => (
                <span
                  key={tick}
                  className={cn(
                    "absolute top-1 -translate-x-1/2 text-xs whitespace-nowrap text-muted-foreground tabular-nums",
                    // Phones: every other tick, so the labels don't run into each other.
                    i % 2 === 1 && "max-sm:hidden"
                  )}
                  style={{ left: percent(tick) }}
                >
                  {tick} s
                </span>
              ))}
            </div>
          </div>
        </div>
      </figure>
    </ArtifactFrame>
  );
}
