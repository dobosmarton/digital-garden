import { allPosts } from "contentlayer/generated";
import RSS from "rss";

import siteMetadata, { BASE_URL, defaultAuthor } from "@/lib/metadata";

// GET route handlers are dynamic by default since Next.js 15; the feed only changes on deploy.
export const dynamic = "force-static";

export async function GET(request: Request) {
  const feed = new RSS({
    title: siteMetadata.title.default,
    description: siteMetadata.description,
    site_url: BASE_URL,
    feed_url: `${BASE_URL}/feed.xml`,
    copyright: `© 2023 ${defaultAuthor.name}`,
    language: "en-US",
    pubDate: new Date(),
  });

  allPosts
    .filter((post) => post.status === "published")
    .map((post) => {
      feed.item({
        title: post.title,
        guid: `${BASE_URL}/posts/${post.slug}`,
        url: `${BASE_URL}/posts/${post.slug}`,
        date: post.lastUpdatedDate as string,
        description: post.description || "",
        author: defaultAuthor.name,
        categories: post?.tags?.map((tag) => tag) || [],
      });
    });

  return new Response(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  });
}
