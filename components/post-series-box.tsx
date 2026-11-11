import { PostSeries } from "@/types";

import { cn } from "@/lib/utils";
import { ArtifactFrame } from "@/components/ui/artifact-frame";
import { cellClass, CellHeader } from "@/components/ui/frame";
import { SeriesLanding, SeriesLink } from "@/components/series-nav";

export type Props = {
  data: PostSeries;
};

const partNumber = (index: number) => String(index + 1).padStart(2, "0");

// The series card in the same detector frame as post artifacts; the series name sits in the
// bracketed label underneath. Moving between parts keeps the box in place and slides the
// current-part marker (see series-nav.tsx); both carry view-transition names for that.
export const PostSeriesBox = ({ data }: Props) => {
  const currentIndex = data.posts.findIndex((post) => post.isCurrent) + 1;
  const currentSlug = data.posts[currentIndex - 1]?.slug ?? "";

  return (
    <aside
      data-series-box
      className="mb-10"
      aria-label={`Series: ${data.title}`}
      style={{ viewTransitionName: "series-box" }}
    >
      <SeriesLanding slug={currentSlug} />
      <ArtifactFrame label={data.title} meta={`${data.posts.length} parts`}>
        <div className={cellClass}>
          <CellHeader label="Series" aside={`Part ${currentIndex} of ${data.posts.length}`} />
          <ol className="space-y-1 px-2 py-3">
            {data.posts.map((p, i) => (
              <li key={p.slug} className="relative flex items-baseline gap-3 rounded-md px-2 py-1.5 text-sm">
                {p.isCurrent && (
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-md bg-accent-foreground/[0.07] shadow-[inset_2px_0_0_hsl(var(--accent-foreground))]"
                    style={{ viewTransitionName: "series-active" }}
                  />
                )}
                <span
                  className={cn(
                    "relative font-mono text-[11px] tabular-nums",
                    p.isCurrent ? "text-accent-foreground" : "text-muted-foreground"
                  )}
                >
                  {partNumber(i)}
                </span>
                {p.isCurrent ? (
                  <span aria-current="page" className="relative font-medium text-foreground">
                    {p.title}
                  </span>
                ) : p.status === "published" ? (
                  <SeriesLink
                    href={`/posts/${p.slug}`}
                    className="relative text-muted-foreground transition-colors hover:text-accent-foreground"
                  >
                    {p.title}
                  </SeriesLink>
                ) : (
                  <span className="relative text-muted-foreground/70">{p.title}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </ArtifactFrame>
    </aside>
  );
};
