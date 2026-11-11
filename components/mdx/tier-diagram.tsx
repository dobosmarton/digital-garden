import { ArrowDown, ArrowRight } from "lucide-react";

import { ArtifactFrame } from "@/components/ui/artifact-frame";

// Stacked tiers of an agent for MDX posts: each tier takes an input, runs at its own cadence,
// and hands its result down to the next tier; the last one produces the output. Desktop: input
// on the left, tier in the middle, output on the right. Phones: one column. Server component.

type Tier = {
  name: string;
  // How often the tier runs, e.g. "every turn".
  cadence: string;
  input: string;
};

type TierDiagramProps = {
  title: string;
  caption?: string;
  tiers: Tier[];
  // What each tier passes to the next one; one label per gap between tiers.
  handoffs: string[];
  output: string;
};

const chip =
  "rounded-md border border-dashed border-foreground/20 px-3 py-2 text-sm leading-snug text-muted-foreground";
const arrow = "size-4 shrink-0 text-foreground/40";

function TierCard({ tier }: { tier: Tier }) {
  return (
    <div className="rounded-md border border-foreground/25 px-3 py-2 text-center">
      <p className="my-0! font-mono text-xs tracking-wider text-foreground uppercase">{tier.name}</p>
      <p className="my-0! text-xs text-muted-foreground">{tier.cadence}</p>
    </div>
  );
}

export function TierDiagram({ title, caption, tiers, handoffs, output }: TierDiagramProps) {
  return (
    <ArtifactFrame label={title} meta={`${tiers.length} tiers`} caption={caption}>
      <figure
        className="not-prose grid grid-cols-1 items-center gap-y-2 font-sans sm:grid-cols-[minmax(0,1fr)_1.5rem_11rem_1.5rem_minmax(0,1fr)] sm:gap-x-2"
        aria-label={title}
      >
        {tiers.map((tier, i) => {
          const last = i === tiers.length - 1;
          return (
            <div key={tier.name} className="contents">
              <p className={`my-0! ${chip}`}>{tier.input}</p>
              <ArrowRight aria-hidden className={`${arrow} hidden justify-self-center sm:block`} />
              <ArrowDown aria-hidden className={`${arrow} justify-self-center sm:hidden`} />
              <TierCard tier={tier} />
              {last ? (
                <>
                  <ArrowRight aria-hidden className={`${arrow} hidden justify-self-center sm:block`} />
                  <ArrowDown aria-hidden className={`${arrow} justify-self-center sm:hidden`} />
                  <p className={`my-0! ${chip}`}>{output}</p>
                </>
              ) : (
                <>
                  <span className="hidden sm:block" />
                  <span className="hidden sm:block" />
                  {/* The handoff to the next tier, under the tier card. */}
                  <span className="hidden sm:block" />
                  <span className="hidden sm:block" />
                  <p className="my-0! flex items-center justify-center gap-1.5 py-1 font-mono text-[11px] text-muted-foreground">
                    <ArrowDown aria-hidden className={arrow} />
                    {handoffs[i]}
                  </p>
                  <span className="hidden sm:block" />
                  <span className="hidden sm:block" />
                </>
              )}
            </div>
          );
        })}
      </figure>
    </ArtifactFrame>
  );
}
