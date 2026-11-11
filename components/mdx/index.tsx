// Server component: posts render to HTML at build time, so the compiled MDX code and
// the MDX runtime never reach the browser. Interactive pieces (the newsletter
// form) are client components rendered as islands inside the content.

import "server-only";

import type { ComponentType } from "react";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import NextImage, { type ImageProps } from "next/image";
import * as ReactDOM from "react-dom";
import type { TweetProps } from "react-tweet";
import { Tweet } from "react-tweet";

import { ArtifactFrame, imageFormat } from "@/components/ui/artifact-frame";

import { CodeFigure } from "./code-figure";
import { DotPlot } from "./dot-plot";
import { Figure } from "./figure";
import { FlowSteps } from "./flow-steps";
import { LoopSteps } from "./loop-steps";
import { NewsletterCTA } from "./newsletter-cta";
import { TableFrame } from "./table-frame";
import { TierDiagram } from "./tier-diagram";
import { TimeBars } from "./time-bars";
import { ToolTrace } from "./tool-trace";
import { YouTubeVideo } from "./youtube-video";

// Bare <Image> in posts: framed like the other artifacts, labelled with its alt text and format.
function FramedImage(props: ImageProps) {
  const label = typeof props.alt === "string" && props.alt ? props.alt : "Image";
  return (
    <ArtifactFrame label={label} meta={imageFormat(props.src)}>
      <NextImage {...props} />
    </ArtifactFrame>
  );
}

const components = {
  figure: CodeFigure,
  table: TableFrame,
  Image: FramedImage,
  Figure,
  DotPlot,
  TierDiagram,
  TimeBars,
  ToolTrace,
  FlowSteps,
  LoopSteps,
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
