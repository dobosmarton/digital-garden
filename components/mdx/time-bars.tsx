import { cn } from "@/lib/utils";
import { ArtifactFrame } from "@/components/ui/artifact-frame";

// Label column, then the bar. The column narrows on phones so the bars fit without scrolling.
const rowGrid = "grid grid-cols-[5rem_1fr] items-center gap-3 sm:grid-cols-[7.5rem_1fr]";

// Stacked horizontal bars for "where does the time go" breakdowns in MDX posts. Every bar is
// drawn on the same scale, so a short phase next to a long one reads at a glance. Server
// component: plain divs, no chart library.

type Tone = "primary" | "primary-light" | "neutral" | "neutral-light";

const toneColor: Record<Tone, string> = {
  primary: "var(--chart-1)",
  "primary-light": "color-mix(in oklab, var(--chart-1) var(--chart-light-mix), hsl(var(--background)))",
  neutral: "var(--chart-neutral)",
  "neutral-light": "color-mix(in oklab, var(--chart-neutral) var(--chart-light-mix), hsl(var(--background)))",
};

type Segment = { tone: Tone; seconds: number; note?: string };
type Bar = { label: string; total: string; segments: Segment[] };

type TimeBarsProps = {
  title: string;
  caption?: string;
  legend: { tone: Tone; label: string }[];
  bars: Bar[];
  tickEvery?: number;
};

const sum = (segments: Segment[]) => segments.reduce((total, segment) => total + segment.seconds, 0);

export function TimeBars({ title, caption, legend, bars, tickEvery = 5 }: TimeBarsProps) {
  const max = Math.max(...bars.map((bar) => sum(bar.segments)));
  const scaleMax = Math.ceil(max / tickEvery) * tickEvery;
  const ticks = Array.from({ length: scaleMax / tickEvery + 1 }, (_, i) => i * tickEvery);
  const percent = (seconds: number) => `${(seconds / scaleMax) * 100}%`;

  return (
    <ArtifactFrame label={title} meta={`${bars.length} rows`} caption={caption}>
      <figure className="not-prose font-sans" role="img" aria-label={title}>
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {legend.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm" style={{ background: toneColor[item.tone] }} />
              {item.label}
            </span>
          ))}
        </div>
        <div className="space-y-3 pr-12">
          {bars.map((bar) => (
            <div key={bar.label} className={rowGrid}>
              <span className="text-sm text-foreground">{bar.label}</span>
              <div className="relative flex h-7 items-center">
                {bar.segments.map((segment, i) => (
                  <span
                    key={i}
                    title={segment.note}
                    className="h-full border-r-2 border-background first:rounded-l last:rounded-r last:border-r-0"
                    style={{ width: percent(segment.seconds), background: toneColor[segment.tone] }}
                  />
                ))}
                <span
                  className="absolute pl-2 text-xs whitespace-nowrap text-muted-foreground tabular-nums"
                  style={{ left: percent(sum(bar.segments)) }}
                >
                  {bar.total}
                </span>
              </div>
            </div>
          ))}
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
