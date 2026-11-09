import { Metadata } from "next";
import { allPosts } from "contentlayer/generated";

import { defaultAuthor } from "@/lib/metadata";
import { sortPosts } from "@/lib/utils";
import PostPreview from "@/components/post-preview";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Posts",
    description: `Posts by ${defaultAuthor.name}`,
  };
}

export default function Blog() {
  const posts = sortPosts(allPosts.filter((post) => post.status === "published"));

  return (
    <div className="container mb-4">
      <div className="mx-auto prose max-w-5xl dark:prose-invert prose-headings:font-heading prose-headings:leading-tight prose-headings:font-bold prose-a:hover:text-accent-foreground prose-headings:prose-a:no-underline">
        <h1 className="mt-0">Latest Posts</h1>
        <hr className="my-4!" />
        <div className="grid grid-flow-row gap-2">
          {posts.map((post) => (
            <PostPreview post={post} key={post._id} />
          ))}
        </div>
      </div>
    </div>
  );
}
