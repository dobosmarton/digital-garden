import { cn } from "@/lib/utils";

const DOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const DOT_DELAYS = [0, 300, 600, 900, 150, 450, 750, 1050, 200];

// 3x3 pixel mark in the accent color. When animated, each pixel blinks on its own beat.
export function DotMatrix({ animated = false, className }: { animated?: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn("grid grid-cols-3 gap-px text-accent-foreground", className)}>
      {DOTS.map((dot) => (
        <span
          key={dot}
          className={cn("h-[3px] w-[3px] bg-current", animated ? "animate-blink" : dot % 2 ? "opacity-30" : "")}
          style={animated ? { animationDelay: `${DOT_DELAYS[dot]}ms` } : undefined}
        />
      ))}
    </span>
  );
}
