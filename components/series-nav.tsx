"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Moving between parts of a series keeps the series box where it is on screen and slides the
// "current part" marker from the old part to the new one, using the View Transitions API.
// The old page stays frozen on screen until the new one has rendered and been scrolled so
// its series box sits exactly where the old one was.

const BOX_SELECTOR = "[data-series-box]";
const SAFETY_MS = 4_000;

type Pending = { fromTop: number; land: () => void };

// One navigation at a time; set by the clicked link, cleared by the new page's box.
let pending: Pending | null = null;

const boxTop = () => document.querySelector(BOX_SELECTOR)?.getBoundingClientRect().top;

const isPlainLeftClick = (event: React.MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

export function SeriesLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const fromTop = boxTop();
    if (event.defaultPrevented || !isPlainLeftClick(event) || fromTop === undefined) return;
    event.preventDefault();

    const navigate = () =>
      new Promise<void>((resolve) => {
        const land = () => {
          if (pending?.land === land) pending = null;
          resolve();
        };
        pending = { fromTop, land };
        router.push(href, { scroll: false });
        // Never leave the old page frozen if the new one fails to render.
        setTimeout(land, SAFETY_MS);
      });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof document.startViewTransition !== "function" || reducedMotion) {
      void navigate();
      return;
    }
    document.startViewTransition(navigate);
  };

  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}

// Rendered inside the series box of every post. When a series navigation is pending, it
// scrolls the new page so the box lines up with where the old one was, then lets the
// view transition run.
export function SeriesLanding({ slug }: { slug: string }) {
  React.useLayoutEffect(() => {
    if (!pending) return;
    const toTop = boxTop();
    if (toTop !== undefined) window.scrollBy(0, toTop - pending.fromTop);
    pending.land();
  }, [slug]);

  return null;
}
