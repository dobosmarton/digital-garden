import { ExternalLink, Wrench } from "lucide-react";

import { getTool } from "@/lib/tools-registry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="my-6">
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Wrench size={18} className="text-accent-foreground" />
        <CardTitle>Tools &amp; References</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="m-0 list-none space-y-4 p-0">
          {resolved.map((tool) => (
            <li key={tool.url} className="list-none pl-0">
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-accent-foreground no-underline transition-colors hover:text-accent-foreground/80"
              >
                {tool.name}
                <ExternalLink size={13} />
              </a>
              <p className="m-0 mt-0.5 text-sm text-muted-foreground">{tool.note}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
