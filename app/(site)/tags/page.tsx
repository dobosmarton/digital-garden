import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allPosts } from "contentlayer/generated";

import siteMetadata, { BASE_URL } from "@/lib/metadata";
import { getTagsWithCount } from "@/lib/utils";
import { PageHeader } from "@/components/ui/frame";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Tags";
  const description = `Browse all topics on ${siteMetadata.title.default}.`;
  const url = `${BASE_URL}/tags`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function TagsPage() {
  const posts = allPosts.filter((post) => post.status === "published");

  const tags: Record<string, number> = getTagsWithCount(posts);

  if (!tags || Object.keys(tags).length === 0) {
    notFound();
  }

  const sorted = Object.entries(tags).sort(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b));

  return (
    <div className="container max-w-6xl pt-6 pb-10">
      <div className="max-w-3xl">
        <PageHeader label="Topics" title="All tags" aside={`${sorted.length} tags`} />
        {/* A grid of hairline cells: the list draws the top and left edges, each cell its right and bottom. */}
        <ul className="grid grid-cols-2 overflow-hidden rounded-lg border-t border-l border-foreground/10 bg-card sm:grid-cols-3">
          {sorted.map(([tag, count]) => (
            <li key={tag} className="border-r border-b border-foreground/10">
              <Link
                href={`/tags/${tag}`}
                className="group flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent-foreground/[0.05]"
              >
                <span className="truncate transition-colors group-hover:text-accent-foreground">{tag}</span>
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  {String(count).padStart(2, "0")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
