import { ExternalLink } from "lucide-react";

import { getTool } from "@/lib/tools-registry";
import { SectionLabel } from "@/components/ui/frame";

export type ToolReferenceData = {
  slug: string;
  note?: string;
};

export type Props = {
  tools: ToolReferenceData[];
};

export const PostReferencesBox = ({ tools }: Props) => {
  const resolved = tools
    .map((ref) => {
      const tool = getTool(ref.slug);
      if (!tool) return null;
      return { ...tool, note: ref.note ?? tool.description };
    })
    .filter((tool): tool is NonNullable<typeof tool> => tool !== null);

  if (resolved.length === 0) {
    return null;
  }

  return (
    <section className="mt-14" aria-labelledby="tools-and-references">
      <SectionLabel id="tools-and-references" aside={`${resolved.length}`}>
        Tools and references
      </SectionLabel>
      <ul className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {resolved.map((tool) => (
          <li key={tool.url}>
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[0.95rem] font-medium text-foreground underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-accent-foreground hover:decoration-accent-foreground"
            >
              {tool.name}
              <ExternalLink size={12} aria-hidden="true" className="text-muted-foreground" />
            </a>
            <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{tool.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};
