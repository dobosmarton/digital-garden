"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PostHeading } from "@/types";

import { cn } from "@/lib/utils";

interface TocProps {
  chapters: PostHeading[];
}

export function TableOfContents({ chapters }: TocProps) {
  const [activeSlug, setActiveSlug] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries: any) => {
        entries.forEach((entry: any) => {
          if (entry?.isIntersecting) {
            setActiveSlug(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-30% 0px",
      }
    );

    chapters.forEach((chapter) => {
      const element = document.getElementById(chapter.slug);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [chapters]);

  return (
    <nav aria-label="Table of contents">
      <ol className="list-none space-y-0.5 border-l border-foreground/10 text-sm">
        {chapters.map((heading: PostHeading) => (
          <li key={heading.slug} className="list-none">
            <Link
              href={`#${heading.slug}`}
              aria-current={activeSlug === heading.slug ? "location" : undefined}
              className={cn(
                "-ml-px block border-l-2 border-transparent py-1 pr-2 pl-3 leading-snug text-muted-foreground transition-colors hover:text-foreground",
                heading.heading === 3 && "pl-6",
                heading.heading >= 4 && "pl-9",
                activeSlug === heading.slug && "border-accent-foreground font-medium text-foreground"
              )}
            >
              {heading.text.replace(/`/g, "")}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
