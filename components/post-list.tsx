import type { Post } from "contentlayer/generated";

import PostPreview from "@/components/post-preview";

// Pulled out by the cards' own padding so post titles line up with the page's text edge.
// `data-detect-item` lets the home page detector frame a post on hover; it is inert elsewhere.
export function PostList({ posts }: { posts: Post[] }) {
  return (
    <div className="-mx-4 grid grid-flow-row gap-2">
      {posts.map((post) => (
        <div key={post._id} data-detect-item="post_preview" data-detect-name={post.title}>
          <PostPreview post={post} />
        </div>
      ))}
    </div>
  );
}
