"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { defaultFilter } from "cmdk";
import { File, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { siGithub, siX } from "simple-icons";

import { defaultAuthor } from "@/lib/metadata";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

// cmdk 1.x's default filter is fuzzy (scattered letters match). Keep the stricter
// behaviour of cmdk 0.2: an item must contain every search term, ranked by cmdk's scorer.
const filterItems = (value: string, search: string, keywords?: string[]) => {
  const haystack = [value, ...(keywords ?? [])].join(" ").toLowerCase();
  const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.every((term) => haystack.includes(term))) return 0;
  return Math.max(defaultFilter(value, search, keywords), 0.01);
};

export type CommandPost = { slug: string; title: string; tags?: string[] };

type Props = React.ComponentProps<typeof Button> & { posts: CommandPost[] };

export function CommandDialogComponent({ posts, ...props }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = (href: string) => {
    if (href.startsWith("http")) {
      window.open(href, "_blank");
    } else {
      router.push(href);
    }
  };

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        className={cn(
          "relative h-9 w-full justify-start rounded-[0.5rem] text-sm text-muted-foreground sm:pr-12 md:w-32 lg:w-64"
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        <span className="inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute top-1.5 right-1.5 hidden h-6 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} filter={filterItems}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Content">
            {posts.map((post) => (
              <CommandItem
                key={post.slug}
                value={[post.title, ...(post.tags ?? [])].join(" ")}
                onSelect={() => {
                  runCommand(() => navigate(`/posts/${post.slug}`));
                }}
              >
                <File className="mr-2 h-4 w-4 shrink-0" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate">{post.title}</span>
                  {post.tags && post.tags.length > 0 && (
                    <span className="truncate text-xs text-muted-foreground">{post.tags.join(", ")}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Social">
            <CommandItem
              onSelect={() => {
                runCommand(() =>
                  navigate(defaultAuthor.socialProfiles.find((platform) => platform.name === "x")?.link as string)
                );
              }}
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                className="mr-2 h-4 w-4"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d={siX.path}></path>
              </svg>

              <span>X (formerly Twitter)</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() =>
                  navigate(defaultAuthor.socialProfiles.find((platform) => platform.name === "github")?.link as string)
                );
              }}
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                className="mr-2 h-4 w-4"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d={siGithub.path}></path>
              </svg>
              <span>Github</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <Sun className="mr-2 h-4 w-4" />
              Light
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
              <Laptop className="mr-2 h-4 w-4" />
              System
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
