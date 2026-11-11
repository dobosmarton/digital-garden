import * as React from "react";

import { HeroAgent } from "@/components/hero-agent/hero-agent";
import { NewsletterSubscribeInline } from "@/components/newsletter-subscribe";

interface HeroProps {
  title: string;
  subtitle: string;
  // Rendered under the intro in the left column, beside the sticky agent rail.
  children?: React.ReactNode;
}

export function HeroImage({ title, subtitle, children }: HeroProps) {
  return (
    <section
      data-hero-root
      className="relative container grid max-w-6xl gap-x-12 gap-y-14 pt-6 lg:grid-cols-12 lg:gap-y-16"
    >
      <div className="flex max-w-xl flex-col lg:col-span-7 lg:pt-10">
        <h1 data-detect="headline" className="font-heading text-5xl font-bold tracking-tight sm:text-6xl">
          {title}
        </h1>
        <h2 data-detect="subtitle" className="mt-6 font-heading text-lg text-muted-foreground">
          {subtitle}
        </h2>
        <NewsletterSubscribeInline className="mt-8" caption="One email per new post" buttonText="Subscribe" />
      </div>
      <div className="lg:col-span-5 lg:row-span-2">
        <div className="lg:sticky lg:top-24">
          <HeroAgent />
        </div>
      </div>
      {children && <div className="min-w-0 lg:col-span-7">{children}</div>}
    </section>
  );
}
