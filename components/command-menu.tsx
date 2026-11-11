"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { defaultFilter } from "cmdk";
import { File, Laptop, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { defaultAuthor } from "@/lib/metadata";
import { includesAllTerms, toSearchTerms } from "@/lib/search";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { BracketLabel, CellFooter } from "@/components/ui/frame";
import { BrandIcon } from "@/components/brand-icon";
import type { CommandPost } from "@/components/command-dialog";

const SOCIAL_LABELS: Record<string, string> = {
  x: "X (formerly Twitter)",
  github: "Github",
};

const socialCommands = defaultAuthor.socialProfiles
  .filter((profile) => profile.name in SOCIAL_LABELS)
  .map((profile) => ({ name: profile.name, label: SOCIAL_LABELS[profile.name], link: profile.link }));

const themeCommands: { theme: string; label: string; Icon: LucideIcon }[] = [
  { theme: "light", label: "Light", Icon: Sun },
  { theme: "dark", label: "Dark", Icon: Moon },
  { theme: "system", label: "System", Icon: Laptop },
];

// cmdk 1.x's default filter is fuzzy (scattered letters match). Keep the stricter
// behaviour of cmdk 0.2: an item must contain every search term, ranked by cmdk's scorer.
function filterItems(value: string, search: string, keywords: string[] = []) {
  if (!includesAllTerms([value, ...keywords].join(" "), toSearchTerms(search))) return 0;
  return Math.max(defaultFilter(value, search, keywords), 0.01);
}

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="mr-1 rounded border border-foreground/10 bg-background px-1 py-px font-mono text-[10px]">
      {children}
    </kbd>
  );
}

type CommandMenuProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  posts: CommandPost[];
};

// Loaded on demand by CommandDialogComponent, so cmdk stays out of the initial bundle.
export default function CommandMenu({ open, setOpen, posts }: CommandMenuProps) {
  const router = useRouter();
  const { setTheme } = useTheme();

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} filter={filterItems}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading={<BracketLabel>Posts</BracketLabel>}>
          {posts.map((post) => (
            <CommandItem
              key={post.slug}
              value={[post.title, ...(post.tags ?? [])].join(" ")}
              onSelect={() => runCommand(() => router.push(`/posts/${post.slug}`))}
            >
              <File className="mr-2 h-4 w-4 shrink-0 opacity-70" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate">{post.title}</span>
                {post.tags?.length ? (
                  <span className="truncate text-xs text-muted-foreground">{post.tags.join(", ")}</span>
                ) : null}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={<BracketLabel>Social</BracketLabel>}>
          {socialCommands.map(({ name, label, link }) => (
            <CommandItem
              key={name}
              onSelect={() => runCommand(() => window.open(link, "_blank", "noopener,noreferrer"))}
            >
              <BrandIcon name={name} className="mr-2 h-4 w-4" />
              <span>{label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={<BracketLabel>Theme</BracketLabel>}>
          {themeCommands.map(({ theme, label, Icon }) => (
            <CommandItem key={theme} onSelect={() => runCommand(() => setTheme(theme))}>
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <CellFooter className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <span>
            <Key>↑↓</Key> navigate
          </span>
          <span>
            <Key>↵</Key> open
          </span>
          <span className="hidden sm:inline">
            <Key>esc</Key> close
          </span>
        </span>
        <span>{posts.length} posts</span>
      </CellFooter>
    </CommandDialog>
  );
}
