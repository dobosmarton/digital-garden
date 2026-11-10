import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostSeries, SeriesItem } from "@/types";
import { allPosts } from "contentlayer/generated";
import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";

import { BASE_URL, defaultAuthor } from "@/lib/metadata";
import { blogPostingJsonLd, breadcrumbJsonLd, postUrl, twitterHandle } from "@/lib/seo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mdx } from "@/components/mdx";
import NewsletterSubscribe from "@/components/newsletter-subscribe";
import { PostReferencesBox } from "@/components/post-references-box";
import { PostSeriesBox } from "@/components/post-series-box";
import { RelatedPosts } from "@/components/related-posts";
import { SocialShare } from "@/components/social-share";
import { TableOfContents } from "@/components/table-of-contents";

type Params = { slug: string };

interface PostProps {
  params: Promise<Params>;
}

async function getPostFromParams(params: Params): Promise<any> {
  const post = allPosts.find((post) => post.slug === params.slug);

  if (!post) {
    null;
  }

  if (post?.series) {
    const seriesPosts: SeriesItem[] = allPosts
      .filter((p) => p.series?.title === post.series?.title)
      .sort((a, b) => Number(a.series!.order) - Number(b.series!.order))
      .map((p) => {
        return {
          title: p.title,
          slug: p.slug,
          status: p.status,
          isCurrent: p.slug === post.slug,
        };
      });
    if (seriesPosts.length > 0) {
      return { ...post, series: { ...post.series, posts: seriesPosts } as PostSeries };
    }
  }

  return post;
}

export async function generateMetadata(props: PostProps): Promise<Metadata> {
  const params = await props.params;
  const post = await getPostFromParams(params);

  if (!post) {
    return {};
  }

  const url = postUrl(post.slug);
  const publishedTime = new Date(post.publishedDate).toISOString();
  const modifiedTime = post.lastUpdatedDate ? new Date(post.lastUpdatedDate).toISOString() : publishedTime;
  const authorName = post?.author?.name || defaultAuthor.name;
  const coverImages = post.coverImage
    ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }]
    : undefined;

  return {
    title: post.title,
    description: post.description,
    authors: [{ name: authorName, url: defaultAuthor.website }],
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      siteName: `${defaultAuthor.name}'s Blog`,
      publishedTime,
      modifiedTime,
      authors: [defaultAuthor.website],
      tags: post.tags,
      ...(coverImages && { images: coverImages }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      creator: twitterHandle,
      site: twitterHandle,
      ...(coverImages && { images: coverImages }),
    },
  };
}

export async function generateStaticParams(): Promise<Params[]> {
  return allPosts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage(props: PostProps) {
  const params = await props.params;
  const post = await getPostFromParams(params);

  if (!post || (process.env.NODE_ENV === "development" && post.status !== "published")) {
    notFound();
  }

  const articleJsonLd = blogPostingJsonLd({
    title: post.title,
    description: post.description,
    slug: post.slug,
    publishedDate: post.publishedDate,
    lastUpdatedDate: post.lastUpdatedDate,
    tags: post.tags,
    coverImage: post.coverImage,
    author: post.author && { name: post.author.name, url: defaultAuthor.website },
  });

  const breadcrumbsJsonLd = breadcrumbJsonLd([
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Blog", url: `${BASE_URL}/posts` },
    { name: post.title, url: postUrl(post.slug) },
  ]);

  const published = format(parseISO(post.publishedDate), "LLLL d, yyyy");
  const updated = post.lastUpdatedDate && format(parseISO(post.lastUpdatedDate), "LLLL d, yyyy");
  const hasToc = post.headings.length > 1;

  return (
    <div className="pb-10">
      <div className="mx-auto grid w-full max-w-[60rem] grid-cols-1 px-5 pt-6 sm:px-8 xl:grid-cols-[minmax(0,40rem)_13rem] xl:justify-between xl:gap-x-16">
        <article>
          <header className="not-prose mb-10">
            <Link
              href="/posts"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              All posts
            </Link>
            <h1 className="mt-6 font-heading text-[2.1rem] leading-[1.12] font-bold tracking-tight text-balance text-slate-950 sm:text-[2.6rem] dark:text-slate-50">
              {post.title}
            </h1>
            {post.description && (
              <p className="mt-5 font-serif text-xl leading-relaxed text-pretty text-slate-600 sm:text-[1.3rem] dark:text-slate-300">
                {post.description}
              </p>
            )}
            <p className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <time dateTime={post.publishedDate}>{published}</time>
              {updated && (
                <span>
                  Updated <time dateTime={post.lastUpdatedDate}>{updated}</time>
                </span>
              )}
              <span>{post.readTimeMinutes} min read</span>
            </p>
          </header>
          {hasToc && (
            <div className="not-prose mb-10 xl:hidden">
              <Accordion type="single" collapsible className="border-y">
                <AccordionItem value="table-of-contents" className="border-b-0">
                  <AccordionTrigger className="py-3 text-sm hover:no-underline">Contents</AccordionTrigger>
                  <AccordionContent>
                    <TableOfContents chapters={post.headings} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
          {post?.series && (
            <div className="not-prose">
              <PostSeriesBox data={post.series} />
            </div>
          )}
          <div className="article prose dark:prose-invert">
            <Mdx code={post.body.code} />
          </div>
          {post.tools && post.tools.length > 0 && (
            <div className="not-prose">
              <PostReferencesBox tools={post.tools} />
            </div>
          )}
          <footer className="not-prose mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
            {post.tags && (
              <ul className="flex flex-wrap gap-2 text-sm">
                {post.tags.map((tag: string) => (
                  <li key={tag}>
                    <Link
                      href={`/tags/${tag}`}
                      className="inline-block rounded-full bg-muted px-3 py-1 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <SocialShare
              text={`${post.title} via ${defaultAuthor.handle}`}
              url={`${BASE_URL}/${post._raw.flattenedPath}`}
            />
          </footer>
        </article>
        {hasToc && (
          <aside className="hidden pt-[3.4rem] xl:block">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <p className="mb-3 text-sm font-medium text-foreground">On this page</p>
              <TableOfContents chapters={post.headings} />
            </div>
          </aside>
        )}
      </div>
      <NewsletterSubscribe
        title="Liked this post?"
        description="Get an email when I publish the next one. No spam, unsubscribe anytime."
        buttonText="Subscribe"
      />
      <div className="container w-full lg:max-w-6xl">
        <RelatedPosts currentSlug={post.slug} tags={post.tags} />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }} />
    </div>
  );
}
