import * as React from "react";

import { cellClass, CellFooter, CellHeader, Corners } from "@/components/ui/frame";

type StatusPanelProps = {
  code: string;
  status: string;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
};

// Full-page status message (404, errors) in the same cell style as the rest of the site.
export function StatusPanel({ code, status, title, children, actions }: StatusPanelProps) {
  return (
    <div className="container max-w-6xl pt-6 pb-16">
      <div className="relative max-w-3xl">
        <Corners className="text-foreground/25" />
        <div className={cellClass}>
          <CellHeader label={code} aside={status} />
          <div className="px-6 py-10 sm:px-10">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{title}</h1>
            <p className="mt-4 text-muted-foreground">{children}</p>
            <div className="mt-8 flex flex-wrap gap-2">{actions}</div>
          </div>
          <CellFooter>Lost? Search (⌘K) finds any post.</CellFooter>
        </div>
      </div>
    </div>
  );
}
