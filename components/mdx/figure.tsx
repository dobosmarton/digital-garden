import NextImage from "next/image";

import { ArtifactFrame, imageFormat } from "@/components/ui/artifact-frame";

type FigureProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
};

export function Figure({ src, alt, width, height, caption }: FigureProps) {
  return (
    <ArtifactFrame label={alt} meta={imageFormat(src)} caption={caption}>
      <NextImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 1024px) 672px, 100vw"
        className="my-0! h-auto w-full border border-border"
      />
    </ArtifactFrame>
  );
}
