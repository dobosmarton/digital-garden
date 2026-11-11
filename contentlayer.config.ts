import { makeSource } from "contentlayer2/source-files";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode, { Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Plugin } from "unified";

import { Page } from "./lib/content-definitions/page";
import { Post } from "./lib/content-definitions/post";

export const HEADING_LINK_ANCHOR = `anchor-heading-link`;

export default makeSource({
  contentDirPath: "./content",
  documentTypes: [Post, Page],
  // The check expects `compilerOptions.baseUrl`, which TypeScript 6 deprecates; the
  // `contentlayer/generated` path alias resolves without it.
  disableImportAliasWarning: true,
  mdx: {
    esbuildOptions(options) {
      options.target = "esnext";
      return options;
    },
    // Only $$...$$ is math: single dollars are prices in prose ("$3.00 ... $0.30"), and
    // remark-math would otherwise render the text between them as a formula.
    remarkPlugins: [[remarkGfm], [remarkMath, { singleDollarTextMath: false }]],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: {
            className: [HEADING_LINK_ANCHOR],
          },
        },
      ],
      [
        rehypePrettyCode as Plugin<any[], any, any>,
        {
          // Both themes ship as CSS variables (--shiki-light / --shiki-dark); globals.css
          // picks one per color scheme. The card supplies the background.
          theme: { light: "github-light", dark: "github-dark" },
          keepBackground: false,
          // Unlabelled fences still get the figure wrapper, so every block has a header strip.
          defaultLang: { block: "plaintext" },
        } satisfies Partial<PrettyCodeOptions>,
      ],
    ],
  },
  onSuccess: async (data) => {
    // write the data to a file, so we can use it in search
    const { allDocuments } = await data();
    console.log("allDocuments", allDocuments.length);
  },
});
