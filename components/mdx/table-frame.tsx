import * as React from "react";

import { ArtifactFrame } from "@/components/ui/artifact-frame";

type ElementProps = { children?: React.ReactNode };

const elementsOf = (node: React.ReactNode) => React.Children.toArray(node).filter(React.isValidElement<ElementProps>);

function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement<ElementProps>(node)) return textOf(node.props.children);
  return "";
}

// The first header cell names what the rows are (Setting, Run, Augmentation), so it labels
// the table; the body row count rides along like a detector's confidence score.
function describe(children: React.ReactNode) {
  const sections = elementsOf(children);
  const head = sections.find((section) => section.type === "thead");
  const body = sections.find((section) => section.type === "tbody");
  const firstHeaderRow = elementsOf(head?.props.children)[0];
  const firstHeaderCell = elementsOf(firstHeaderRow?.props.children)[0];
  const label = textOf(firstHeaderCell?.props.children).trim() || "Table";
  const rows = elementsOf(body?.props.children).length;
  return { label, rows };
}

// Wide tables scroll inside their own box instead of widening the page on phones; the
// artifact frame and its label sit outside that box.
export function TableFrame({ children, ...props }: React.ComponentProps<"table">) {
  const { label, rows } = describe(children);

  return (
    <ArtifactFrame label={label} meta={rows === 1 ? "1 row" : `${rows} rows`}>
      <div className="table-scroll">
        <table {...props}>{children}</table>
      </div>
    </ArtifactFrame>
  );
}
