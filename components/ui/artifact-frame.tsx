import * as React from "react";

import { cn } from "@/lib/utils";
import { Corners } from "@/components/ui/frame";

type ArtifactFrameProps = {
  // What the artifact holds (a table's subject, a chart title, an image's alt text).
  label: string;
  // A size-like detail shown in the accent color, like a detector's confidence score.
  meta?: string;
  // The explanation. When present it replaces the label in the bracketed text, since the
  // two usually say the same thing; the label stays on the artifact itself (alt, title).
  caption?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

// An image's file format ("PNG", "AVIF") for its label. Declared width/height props can be
// wrong in posts (the browser keeps the file's real proportions), so they are not shown.
export function imageFormat(src: unknown): string | undefined {
  const path = typeof src === "string" ? src : typeof src === "object" && src && "src" in src ? String(src.src) : "";
  return path.match(/\.([a-z0-9]+)(?:[?#].*)?$/i)?.[1]?.toUpperCase();
}

// The detector frame around post artifacts (tables, code, charts, images, video): a thin
// outline with "+" corner marks holding only the artifact. Underneath, one mono line of text
// (the caption, or the label when there is none) and the meta, set in drawn [ ] brackets
// that stretch to fit several lines.
// Styles live in globals.css under `.artifact`, so it renders the same on the server and
// the client.
export function ArtifactFrame({ label, meta, caption, children, className }: ArtifactFrameProps) {
  return (
    <figure className={cn("artifact", className)}>
      <div className="artifact-frame">
        <Corners />
        {children}
      </div>
      <figcaption className="artifact-caption">
        {caption ?? label}
        {meta && <span className="artifact-label-meta"> {meta}</span>}
      </figcaption>
    </figure>
  );
}
