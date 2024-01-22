import { makeSource } from "contentlayer/source-files";
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
  mdx: {
    esbuildOptions(options) {
      options.target = "esnext";
      return options;
    },
    remarkPlugins: [[remarkGfm], [remarkMath]],
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
          // prepacked themes
          // https://github.com/shikijs/shiki/blob/main/docs/themes.md
          theme: "github-dark",

          // https://stackoverflow.com/questions/76549262/onvisithighlightedline-cannot-push-classname-using-rehype-pretty-code
          // FIXME: maybe properly type this
          onVisitLine(node: any) {
            // Prevent lines from collapsing in `display: grid` mode, and
            // allow empty lines to be copy/pasted
            if (node.children.length === 0) {
              node.children = [{ type: "text", value: " " }];
            }
            node.properties.className = ["line"]; // add 'line' class to each line in the code block
          },

          // FIXME: maybe properly type this
          onVisitHighlightedLine(node: any) {
            const nodeClass = node.properties.className;

            if (nodeClass && nodeClass.length > 0) {
              node.properties.className.push("line--highlighted");
            } else {
              node.properties.className = ["line--highlighted"];
            }
          },
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
