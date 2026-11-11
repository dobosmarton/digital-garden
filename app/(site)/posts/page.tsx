import { Metadata } from "next";
import { allPosts } from "contentlayer/generated";

import { defaultAuthor } from "@/lib/metadata";
import { sortPosts } from "@/lib/utils";
import { PageHeader } from "@/components/ui/frame";
import { PostList } from "@/components/post-list";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Posts",
    description: `Posts by ${defaultAuthor.name}`,
  };
}

export default function Blog() {
  const posts = sortPosts(allPosts.filter((post) => post.status === "published"));

  return (
    <div className="container max-w-6xl pt-6 pb-10">
      <div className="max-w-3xl">
        <PageHeader label="Blog" title="All posts" aside={`${posts.length} posts`} />
        <PostList posts={posts} />
      </div>
    </div>
  );
}
