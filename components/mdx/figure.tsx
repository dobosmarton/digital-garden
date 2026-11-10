import NextImage from "next/image";

type FigureProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
};

export function Figure({ src, alt, width, height, caption }: FigureProps) {
  return (
    <figure>
      <NextImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 1024px) 672px, 100vw"
        className="my-0! h-auto w-full border border-border"
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
