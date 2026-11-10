// Server component: posts render to HTML at build time, so the compiled MDX code and
// the MDX runtime never reach the browser. Interactive pieces (the newsletter
// form) are client components rendered as islands inside the content.

import "server-only";

import type { ComponentType } from "react";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import NextImage from "next/image";
import * as ReactDOM from "react-dom";
import type { TweetProps } from "react-tweet";
import { Tweet } from "react-tweet";

import { NewsletterCTA } from "./newsletter-cta";
import { YouTubeVideo } from "./youtube-video";

const components = {
  // Wide tables scroll inside their own box instead of widening the page on phones.
  table: (props: React.ComponentProps<"table">) => (
    <div className="table-scroll">
      <table {...props} />
    </div>
  ),
  Image: NextImage,
  NewsletterCTA,
  YouTubeVideo,
  Tweet: (props: TweetProps) => {
    return (
      <div className="not-prose [&>div]:mx-auto">
        <Tweet {...props} />
      </div>
    );
  },
};

type MDXContent = ComponentType<{ components?: Record<string, ComponentType<any>> }>;

// Equivalent of mdx-bundler's getMDXComponent: evaluates the code Contentlayer compiled
// with mdx-bundler, which expects React, ReactDOM and the JSX runtime in scope.
function getMDXComponent(code: string): MDXContent {
  const scope = { React, ReactDOM, _jsx_runtime: jsxRuntime };
  const fn = new Function(...Object.keys(scope), code);
  return fn(...Object.values(scope)).default;
}

interface MdxProps {
  code: string;
}

export function Mdx({ code }: MdxProps) {
  const Component = getMDXComponent(code);
  // Server components render once per request/build, so there is no re-render identity to preserve.
  // eslint-disable-next-line react-hooks/static-components
  return <Component components={components} />;
}
