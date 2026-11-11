import * as React from "react";
import { Copy } from "lucide-react";

import { ArtifactFrame } from "@/components/ui/artifact-frame";
import { CellHeader } from "@/components/ui/frame";
import { CopyButton } from "@/components/copy-button";

type HastProps = { children?: React.ReactNode } & Record<string, unknown>;

const LANGUAGE_LABELS: Record<string, string> = { plaintext: "text", txt: "text" };

const TITLE_ATTR = "data-rehype-pretty-code-title";

function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement<HastProps>(node)) return textOf(node.props.children);
  return "";
}

// Code blocks from rehype-pretty-code, drawn as a cell: a mono header strip with the
// language, the file title when the block has one, and a copy button.
export function CodeFigure({ children, ...props }: React.ComponentProps<"figure">) {
  if (!("data-rehype-pretty-code-figure" in props)) {
    return <figure {...props}>{children}</figure>;
  }

  const parts = React.Children.toArray(children).filter(React.isValidElement<HastProps>);
  const title = parts.find((part) => TITLE_ATTR in part.props);
  const pre = parts.find((part) => part.type === "pre");
  const body = parts.filter((part) => part !== title);
  const language = String(pre?.props["data-language"] ?? "plaintext");
  const code = textOf(pre?.props.children).replace(/\n$/, "");
  const lines = code.split("\n").length;

  return (
    <ArtifactFrame label="Code" meta={lines === 1 ? "1 line" : `${lines} lines`}>
      <figure {...props}>
        <CellHeader
          label={LANGUAGE_LABELS[language] ?? language}
          aside={
            <>
              {title && <span className="truncate">{textOf(title.props.children)}</span>}
              <CopyButton
                copyText={code}
                variant="ghost"
                size="sm"
                aria-label="Copy code"
                className="h-6 shrink-0 gap-1.5 px-1.5 font-mono text-[11px] font-normal text-muted-foreground hover:bg-transparent hover:text-accent-foreground"
              >
                <Copy className="h-3 w-3" aria-hidden="true" />
                Copy
              </CopyButton>
            </>
          }
        />
        {body}
      </figure>
    </ArtifactFrame>
  );
}
