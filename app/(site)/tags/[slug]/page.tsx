import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allPosts, Post } from "contentlayer/generated";
import { ArrowLeft } from "lucide-react";

import { tagUrl } from "@/lib/seo";
import { sortPosts } from "@/lib/utils";
import { PageHeader } from "@/components/ui/frame";
import { PostList } from "@/components/post-list";

// Get sorted articles from the contentlayer
async function getSortedArticles(): Promise<Post[]> {
  let articles = await allPosts;

  articles = articles.filter((article: Post) => article.status === "published");

  return articles.sort((a: Post, b: Post) => {
    if (a.publishedDate && b.publishedDate) {
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
    }
    return 0;
  });
}

// Dynamic metadata for the page
export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const tag = params.slug;
  const count = allPosts.filter((p) => p.status === "published" && p.tags?.includes(tag)).length;
  const title = `Posts tagged "${tag}"`;
  const description = `${count} post${count === 1 ? "" : "s"} about ${tag}.`;
  const url = tagUrl(tag);
  return {
    title,
    description,
    keywords: [tag],
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TagPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const tag = params.slug;

  const posts = sortPosts(
    allPosts.filter((post) => post.status === "published").filter((post) => post.tags?.includes(tag))
  );

  if (!posts) {
    notFound();
  }

  return (
    <div className="container max-w-6xl pt-6 pb-10">
      <div className="max-w-3xl">
        <Link
          href="/tags"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          <ArrowLeft size={12} aria-hidden="true" />
          All tags
        </Link>
        <PageHeader label="Tag" title={tag} aside={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`} />
        <PostList posts={posts} />
      </div>
    </div>
  );
}
