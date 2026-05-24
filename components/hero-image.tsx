import * as React from "react";

import { HeroTerminal } from "@/components/hero-terminal";

interface HeroProps {
  title: string;
  subtitle: string;
}

export function HeroImage({ title, subtitle }: HeroProps) {
  return (
    <div className="container flex max-w-6xl flex-col items-center gap-10 md:flex-row md:items-center">
      <div className="flex max-w-xl flex-col lg:mr-auto">
        <h1 className="font-heading text-5xl font-bold tracking-tight sm:text-6xl">{title}</h1>
        <h2 className="mt-6 font-heading text-lg text-muted-foreground">{subtitle}</h2>
      </div>
      <div className="hidden w-5/12 lg:flex">
        <HeroTerminal />
      </div>
    </div>
  );
}
