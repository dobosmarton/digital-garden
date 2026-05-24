import { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPosts, Post } from "contentlayer/generated";

import { tagUrl } from "@/lib/seo";
import { sortByDate } from "@/lib/utils";
import PostPreview from "@/components/post-preview";

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
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
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

export default async function TagPage({ params }: { params: { slug: string } }) {
  const tag = params.slug;

  const posts = allPosts
    .filter((post) => post.status === "published")
    .filter((post) => post.tags?.includes(tag))
    .sort(sortByDate);

  if (!posts) {
    notFound();
  }

  return (
    <div className="container mb-4">
      <div className="prose mx-auto max-w-5xl dark:prose-invert prose-headings:font-heading prose-headings:font-bold prose-headings:leading-tight hover:prose-a:text-accent-foreground prose-a:prose-headings:no-underline">
        <h1 className="mt-0">All posts in {tag}</h1>
        <hr className="my-4" />
        <div className="grid grid-flow-row gap-2">
          {posts.map((post) => (
            <PostPreview post={post} key={post._id} />
          ))}
        </div>
      </div>
    </div>
  );
}
