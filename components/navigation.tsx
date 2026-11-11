"use client";

import React, { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket } from "lucide-react";

import siteMetadata, { defaultAuthor } from "@/lib/metadata";
import { cn, debounce } from "@/lib/utils";
import { Corners } from "@/components/ui/frame";
import { AnnouncementBar } from "@/components/announcement-bar";
import { CommandDialogComponent, type CommandPost } from "@/components/command-dialog";
import { MobileNav } from "@/components/mobile-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { Navbar } from "@/components/navbar";
import { WorkAvailabilityBadge } from "@/components/work-availability-badge";

const SCROLL_OFFSET = 200;
// Past this many pixels the desktop header condenses into a floating card.
const CONDENSE_AT = 8;

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

// True once the page has scrolled; re-renders only when that flips, not on every scroll event.
const useScrolled = () =>
  useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > CONDENSE_AT,
    () => false
  );

export function Navigation({ commandPosts }: { commandPosts: CommandPost[] }) {
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const scrolled = useScrolled();
  const showsProgress = usePathname().startsWith("/posts/");

  const handleScroll = useCallback(
    () =>
      debounce(() => {
        const currentScrollPos = window.scrollY;

        if ((prevScrollPos > currentScrollPos && prevScrollPos - currentScrollPos > 70) || currentScrollPos < 10) {
          setVisible(true);
        } else {
          setVisible(false);
        }

        setPrevScrollPos(currentScrollPos);
      }, 100),
    [prevScrollPos, setPrevScrollPos, setVisible]
  );

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollPos, visible, handleScroll]);

  return (
    <>
      {siteMetadata?.activeAnnouncement && (
        <AnnouncementBar
          buttonText={siteMetadata.announcement.buttonText as string}
          link={siteMetadata.announcement.link as string}
        >
          <Rocket className="mr-2 h-5 w-5" />
          <strong className="mr-1">Launching on DevHunt!</strong> If you like this template, please support me by
          upvoting on DevHunt from Aug 21-27.
        </AnnouncementBar>
      )}
      {/* data-site-header: series navigation names this element during its view transition so
          the header stays put. Not named permanently: a named element becomes a backdrop root,
          and the condensed bar's blur would stop seeing the page behind it. */}
      <header
        data-site-header
        className={cn(
          "fixed inset-x-0 -bottom-32 z-20 mx-auto mb-4 animate-out px-4 transition-all duration-1000 sm:top-0 sm:h-16 sm:px-0 sm:transition-none",
          visible && "bottom-0 animate-in",
          siteMetadata.activeAnnouncement && "sm:top-28 md:top-20 lg:top-12"
        )}
      >
        {defaultAuthor.availableForWork && (
          <div className="mx-auto mb-2 text-center sm:hidden">
            <Link href="/now" aria-label="Go to Now page">
              <WorkAvailabilityBadge />
            </Link>
          </div>
        )}
        {/* Mobile: a floating pill at the bottom. Desktop: open and borderless at the top of the
            page, then a floating card the width of the content column once the page scrolls. */}
        <div
          className={cn(
            "relative flex items-center gap-2 rounded-full border border-foreground/10 bg-background/95 px-3 py-2 shadow-lg supports-backdrop-filter:bg-background/70 supports-backdrop-filter:bg-clip-padding supports-backdrop-filter:backdrop-blur-md",
            "sm:mx-auto sm:justify-between sm:px-0 sm:transition-[width,max-width,margin,border-radius,padding,background-color,border-color,box-shadow] sm:duration-500 sm:ease-[cubic-bezier(0.2,0.9,0.3,1)]",
            scrolled
              ? "sm:mt-2 sm:w-[calc(100%-1.5rem)] sm:max-w-6xl sm:rounded-lg sm:py-1.5 sm:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.18)] sm:supports-backdrop-filter:bg-background/80"
              : "sm:mt-0 sm:w-full sm:max-w-full sm:rounded-none sm:border-transparent sm:bg-transparent sm:py-3 sm:shadow-none sm:supports-backdrop-filter:bg-transparent sm:supports-backdrop-filter:backdrop-blur-none"
          )}
        >
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 hidden transition-opacity duration-500 sm:block",
              scrolled ? "opacity-100" : "opacity-0"
            )}
          >
            <Corners className="text-accent-foreground" />
          </span>
          {showsProgress && <span aria-hidden className="header-progress" />}
          <div className="container mx-auto flex max-w-6xl">
            <div className="flex items-center justify-start">
              <div className="group aspect-square h-auto w-10 overflow-hidden rounded-full border border-foreground/10">
                <Link href="/" aria-label="Go to Home">
                  <Image
                    className="duration-300 group-hover:scale-110"
                    width={40}
                    height={40}
                    src="/profile.jpg"
                    alt={defaultAuthor.name}
                  />
                </Link>
              </div>
              {defaultAuthor.availableForWork && (
                <Link href="/now" aria-label="Go to Now page" className="ml-2 hidden sm:block">
                  <WorkAvailabilityBadge />
                </Link>
              )}
            </div>
            <div className="order-3 sm:order-2 sm:ml-auto">
              <nav className="ml-auto hidden space-x-6 text-sm font-medium sm:block sm:w-full">
                <Navbar />
              </nav>
              <nav className="sm:hidden">
                <MobileNav />
              </nav>
            </div>
            <div className="order-2 flex w-full items-center gap-2 sm:order-3 sm:w-fit">
              <CommandDialogComponent posts={commandPosts} />
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
