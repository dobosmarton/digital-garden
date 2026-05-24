"use client";

import * as React from "react";

type Line = { prompt?: string; text: string; pauseAfter?: number };

const lines: Line[] = [
  { prompt: "~ $", text: "whoami" },
  { text: "marton — engineer · writer · builder", pauseAfter: 700 },
  { prompt: "~ $", text: "ls projects/" },
  { text: "aoe2-agent  agent-hq  flatuniverse-app", pauseAfter: 700 },
  { prompt: "~ $", text: "echo $STACK" },
  { text: "typescript · next.js · postgres · ai", pauseAfter: 1600 },
];

const finalRender = lines.map((l) => l.text);

export function HeroTerminal() {
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [rendered, setRendered] = React.useState<string[]>([""]);
  const [lineIdx, setLineIdx] = React.useState(0);
  const [charIdx, setCharIdx] = React.useState(0);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    if (reducedMotion) return;

    if (lineIdx >= lines.length) {
      const t = setTimeout(() => {
        setRendered([""]);
        setLineIdx(0);
        setCharIdx(0);
      }, 2200);
      return () => clearTimeout(t);
    }

    const line = lines[lineIdx];

    if (charIdx < line.text.length) {
      const delay = 32 + Math.random() * 48;
      const t = setTimeout(() => {
        setRendered((prev) => {
          const next = [...prev];
          next[lineIdx] = line.text.slice(0, charIdx + 1);
          return next;
        });
        setCharIdx((c) => c + 1);
      }, delay);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setRendered((prev) => [...prev, ""]);
      setLineIdx((i) => i + 1);
      setCharIdx(0);
    }, line.pauseAfter ?? 200);
    return () => clearTimeout(t);
  }, [reducedMotion, lineIdx, charIdx]);

  const display = reducedMotion ? finalRender : rendered;

  return (
    <div
      aria-hidden
      className="w-full select-none overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 font-mono text-sm shadow-2xl"
    >
      <div className="flex items-center gap-1.5 border-b border-zinc-800 bg-zinc-900/80 px-3 py-2">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
        <span className="h-3 w-3 rounded-full bg-green-500/80" />
        <span className="ml-2 text-xs text-zinc-500">marton@web — zsh</span>
      </div>
      <div className="min-h-[230px] space-y-1 px-4 py-4 text-zinc-100">
        {display.map((text, i) => {
          const line = lines[i];
          if (!line) return null;
          const isCurrent = !reducedMotion && i === lineIdx;
          return (
            <div key={i} className="flex flex-wrap gap-x-2 leading-relaxed">
              {line.prompt && <span className="text-emerald-400">{line.prompt}</span>}
              <span className={line.prompt ? "text-zinc-100" : "text-zinc-400"}>
                {text}
                {isCurrent && <span className="ml-0.5 inline-block animate-pulse text-emerald-400">▌</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
