import { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPages } from "contentlayer/generated";
import { format, parseISO } from "date-fns";

import { PageHeader } from "@/components/ui/frame";
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
    <div className="container max-w-6xl pt-6 pb-10">
      <article className="max-w-3xl">
        <PageHeader
          label="Page"
          title={page.title}
          aside={
            page.lastUpdatedDate && (
              <time dateTime={page.lastUpdatedDate}>
                Updated {format(parseISO(page.lastUpdatedDate), "LLLL d, yyyy")}
              </time>
            )
          }
          className="mb-6"
        />
        {page.description && <p className="mb-10 text-xl text-muted-foreground">{page.description}</p>}
        <div className="prose max-w-none dark:prose-invert prose-headings:mt-8 prose-headings:mb-3 prose-headings:font-heading prose-headings:leading-tight prose-headings:font-bold prose-a:hover:text-accent-foreground prose-headings:prose-a:no-underline">
          <Mdx code={page.body.code} />
        </div>
      </article>
    </div>
  );
}
