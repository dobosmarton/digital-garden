import Link from "next/link";
import { PostSeries } from "@/types";

import { cn } from "@/lib/utils";

export type Props = {
  data: PostSeries;
};

export const PostSeriesBox = ({ data }: Props) => {
  const currentIndex = data.posts.findIndex((post) => post.isCurrent) + 1;

  return (
    <aside className="mb-10 rounded-lg border bg-muted/40 px-5 py-4" aria-label={`Series: ${data.title}`}>
      <p className="text-sm text-muted-foreground">
        Part {currentIndex} of {data.posts.length} in <span className="font-medium text-foreground">{data.title}</span>
      </p>
      <ul className="mt-2">
        {data.posts.map((p) => (
          <li
            key={p.slug}
            className={cn(
              "relative my-2 list-none pl-7 text-sm before:absolute before:top-[9px] before:left-1 before:h-1.5 before:w-1.5 before:rounded-full before:transition-all",
              p.isCurrent
                ? "font-semibold text-accent-foreground before:bg-accent-foreground before:ring-[3px] before:ring-accent-foreground/25 before:ring-offset-1 before:ring-offset-background"
                : "text-muted-foreground before:bg-muted-foreground/40 hover:text-accent-foreground hover:before:bg-accent-foreground/80"
            )}
          >
            {p.status === "published" ? (
              p.isCurrent ? (
                <span>{p.title}</span>
              ) : (
                <Link
                  className="transition-colors duration-200 ease-in-out hover:text-accent-foreground"
                  href={`/posts/${p.slug}`}
                >
                  {p.title}
                </Link>
              )
            ) : (
              <span>{p.title}</span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
};
