import { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPages } from "contentlayer/generated";
import { format, parseISO } from "date-fns";

import { Mdx } from "@/components/mdx";

type Params = { slug: string };

interface PageProps {
  params: Promise<Params>;
}

const getPublishedPages = () => allPages.filter((page) => page.status === "published");

async function getPageFromParams(params: Params) {
  const page = getPublishedPages().find((page) => page.slug === params.slug);

  if (!page) {
    null;
  }

  return page;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const page = await getPageFromParams(params);

  if (!page) {
    return {};
  }

  return {
    title: page.title,
    description: page.description,
  };
}

export async function generateStaticParams(): Promise<Params[]> {
  return getPublishedPages().map((page) => ({
    slug: page.slug,
  }));
}

export default async function PagePage(props: PageProps) {
  const params = await props.params;
  const page = await getPageFromParams(params);

  if (!page || (process.env.NODE_ENV === "development" && page.status !== "published")) {
    notFound();
  }

  return (
    <div className="container max-w-6xl pb-10">
      <article className="mx-auto prose max-w-5xl dark:prose-invert prose-headings:mt-8 prose-headings:mb-3 prose-headings:font-heading prose-headings:leading-tight prose-headings:font-bold prose-a:hover:text-accent-foreground prose-headings:prose-a:no-underline">
        <h1 className="mt-0">{page.title}</h1>
        {page.description && <p className="m-0 text-xl">{page.description}</p>}
        {page.lastUpdatedDate && (
          <time className="text-sm text-slate-500">
            Last updated: {format(parseISO(page.lastUpdatedDate), "LLLL d, yyyy")}
          </time>
        )}
        <hr className="my-4!" />
        <Mdx code={page.body.code} />
      </article>
    </div>
  );
}
