import Link from "next/link";
import { allPosts, Post } from "contentlayer/generated";

import { cn } from "@/lib/utils";
import { cellClass, CellFooter, cellHoverClass, SectionLabel } from "@/components/ui/frame";

type RelatedPostsProps = {
  currentSlug: string;
  tags?: string[];
  limit?: number;
};

const scoreRelatedness = (a: string[] = [], b: string[] = []) => a.filter((tag) => b.includes(tag)).length;

export const RelatedPosts = ({ currentSlug, tags = [], limit = 3 }: RelatedPostsProps) => {
  if (tags.length === 0) return null;

  const candidates = allPosts
    .filter((post): post is Post => post.status === "published" && post.slug !== currentSlug)
    .map((post) => ({ post, score: scoreRelatedness(tags, post.tags ?? []) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.post.publishedDate).getTime() - new Date(a.post.publishedDate).getTime();
    })
    .slice(0, limit)
    .map((entry) => entry.post);

  if (candidates.length === 0) return null;

  return (
    <section aria-labelledby="related-posts-heading" className="not-prose mt-10">
      <SectionLabel id="related-posts-heading" className="mb-5">
        Related posts
      </SectionLabel>
      <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {candidates.map((post) => (
          <li key={post.slug} className="list-none">
            <Link
              href={`/posts/${post.slug}`}
              className={cn(cellClass, cellHoverClass, "group flex h-full flex-col no-underline")}
            >
              <div className="p-4">
                <h3 className="m-0 text-base font-semibold text-foreground transition-colors group-hover:text-accent-foreground">
                  {post.title}
                </h3>
                {post.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.description}</p>
                )}
              </div>
              <CellFooter className="mt-auto">{post.readTimeMinutes} min read</CellFooter>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
