"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const SCROLL_OFFSET: number = 1550;

export const BackTopButton = () => {
  let [show, setShow] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    let handleWindowScroll = () => {
      if (window.scrollY > SCROLL_OFFSET) setShow(true);
      else setShow(false);
    };

    window.addEventListener("scroll", handleWindowScroll);
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Scroll To Top"
      type="button"
      onClick={handleClick}
      className={cn(
        show ? "flex" : "hidden",
        "fixed right-6 bottom-24 z-50 rounded-full border-foreground/10 bg-card text-muted-foreground shadow-sm hover:bg-card hover:text-accent-foreground sm:right-8 sm:bottom-8"
      )}
    >
      <ArrowUp />
    </Button>
  );
};
