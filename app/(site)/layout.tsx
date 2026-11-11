import { allPosts } from "contentlayer/generated";

import siteMetadata from "@/lib/metadata";
import { cn, sortPosts } from "@/lib/utils";
import Footer from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { SiteBackground } from "@/components/site-background";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const commandPosts = sortPosts(allPosts.filter((post) => post.status === "published")).map((post) => ({
    slug: post.slug,
    title: post.title,
    tags: post.tags,
  }));

  return (
    <>
      <a
        className="absolute top-0 left-0 z-9999 m-3 block -translate-y-96 overflow-hidden bg-white p-3 text-2xl text-black transition focus:translate-y-0"
        href="#main-content"
        aria-label="Skip to Content"
      >
        Skip to Content
      </a>
      <Navigation commandPosts={commandPosts} />
      <div className="order-last mt-[calc(--spacing(16)-(--spacing(3)))]"></div>
      <main className={cn("mt-20", siteMetadata.activeAnnouncement && "mt-32 pt-28 md:pt-0")} id="main-content">
        {children}
      </main>
      <Footer />
      <SiteBackground />
    </>
  );
}
