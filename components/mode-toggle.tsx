"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const noopSubscribe = () => () => {};

export function ModeToggle() {
  // false during SSR and hydration, true on the client: the theme is only known client-side.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
  const { setTheme, theme } = useTheme();

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="group hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border border-foreground/10 bg-card text-muted-foreground transition-colors hover:text-accent-foreground sm:flex"
    >
      <span className="sr-only">Toggle dark/light mode</span>
      {theme !== "dark" ? (
        <Moon className="h-4 w-4 duration-300 group-hover:rotate-360" />
      ) : (
        <Sun className="h-4 w-4 duration-300 group-hover:rotate-180" />
      )}
    </button>
  );
}
