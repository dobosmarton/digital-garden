"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

// The site's backdrop: a faint hairline grid, a slow spotlight that lights the grid lines in
// the accent color as it drifts, two soft color glows, and small "+" ticks that blink on
// grid intersections like detector hits. Everything but the ticks is CSS (globals.css,
// `.site-bg`); the ticks need positions on the grid, so they live here.

const CELL = 64;
const TICK_EVERY_MS = 1_400;
const TICK_LIFE_MS = 2_600;
const MAX_TICKS = 4;
// Ticks land in the upper part of the viewport, where the grid is still visible.
const TICK_AREA = 0.7;

type Tick = { id: number; x: number; y: number };

// Ticks only land on empty background: never behind text, cards, frames or form fields.
const CONTENT = "h1, h2, h3, h4, p, a, li, button, input, pre, table, figure, img, [data-detect], [data-detect-item]";

function coversContent(x: number, y: number) {
  const element = document.elementFromPoint(x, y);
  return Boolean(element?.closest(CONTENT));
}

function useTicks() {
  const [ticks, setTicks] = React.useState<Tick[]>([]);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let nextId = 0;
    const timer = setInterval(() => {
      if (document.hidden) return;
      const columns = Math.floor(window.innerWidth / CELL);
      const rows = Math.floor((window.innerHeight * TICK_AREA) / CELL);
      if (columns < 2 || rows < 2) return;
      const tick = {
        id: nextId++,
        x: (1 + Math.floor(Math.random() * (columns - 1))) * CELL,
        y: (1 + Math.floor(Math.random() * (rows - 1))) * CELL,
      };
      if (coversContent(tick.x, tick.y)) return;
      setTicks((current) => [...current.slice(-(MAX_TICKS - 1)), tick]);
      setTimeout(() => setTicks((current) => current.filter((t) => t.id !== tick.id)), TICK_LIFE_MS);
    }, TICK_EVERY_MS);
    return () => clearInterval(timer);
  }, []);

  return ticks;
}

// Pages people read top to bottom (posts, /now). There the grid lines stay out of the text
// column; the home page and the lists keep the full backdrop.
const isReadingPage = (pathname: string) => pathname !== "/" && pathname !== "/posts" && !pathname.startsWith("/tags");

export function SiteBackground() {
  const ticks = useTicks();
  const reading = isReadingPage(usePathname());

  return (
    <div aria-hidden className={reading ? "site-bg site-bg-reading" : "site-bg"}>
      <div className="site-bg-glow site-bg-glow-a" />
      <div className="site-bg-glow site-bg-glow-b" />
      <div className="site-bg-lines">
        <div className="site-bg-grid" />
        <div className="site-bg-spot" />
        {ticks.map((tick) => (
          <svg
            key={tick.id}
            viewBox="0 0 9 9"
            className="site-bg-tick"
            style={{ transform: `translate(${tick.x - 4.5}px, ${tick.y - 4.5}px)` }}
          >
            <path d="M4.5 0v9M0 4.5h9" stroke="currentColor" strokeWidth="1" />
          </svg>
        ))}
      </div>
    </div>
  );
}
