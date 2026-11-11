"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";

export type CommandPost = { slug: string; title: string; tags?: string[] };

const loadCommandMenu = () => import("@/components/command-menu");
const CommandMenu = dynamic(loadCommandMenu, { ssr: false });

type Props = React.ComponentProps<typeof Button> & { posts: CommandPost[] };

// Search button and ⌘K shortcut. The menu itself (cmdk) is fetched on first use and
// prefetched when the pointer or focus reaches the button. Once loaded it stays mounted
// so the dialog keeps its close animation.
export function CommandDialogComponent({ posts, ...props }: Props) {
  const [open, setOpen] = React.useState(false);
  const [hasOpened, setHasOpened] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setHasOpened(true);
      setOpen((isOpen) => !isOpen);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const showMenu = () => {
    setHasOpened(true);
    setOpen(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        className="relative h-9 w-full justify-start rounded-md border border-foreground/10 bg-card text-sm font-normal text-muted-foreground hover:bg-card hover:text-foreground sm:pr-12 md:w-32 lg:w-64"
        onClick={showMenu}
        onPointerEnter={loadCommandMenu}
        onFocus={loadCommandMenu}
        {...props}
      >
        <span className="inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute top-1.5 right-1.5 hidden h-6 items-center gap-1 rounded border border-foreground/10 bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      {hasOpened ? <CommandMenu open={open} setOpen={setOpen} posts={posts} /> : null}
    </>
  );
}
