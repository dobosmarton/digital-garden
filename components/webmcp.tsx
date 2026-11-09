"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const NAVIGATION_TIMEOUT_MS = 10_000;

// Exposes the site to in-browser AI agents via WebMCP. Renders nothing. The tool
// definitions are only downloaded in browsers that implement `document.modelContext`.
export function WebMCP() {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const pendingNavigations = useRef(new Set<() => void>());

  useEffect(() => {
    pendingNavigations.current.forEach((resolve) => resolve());
  }, [pathname]);

  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext) return;

    const controller = new AbortController();
    const pending = pendingNavigations.current;

    // Resolves once the App Router has rendered the new route (or after a timeout).
    const navigate = (href: string) =>
      new Promise<void>((resolve) => {
        const samePage = new URL(href, window.location.href).pathname === window.location.pathname;
        if (samePage) {
          router.push(href);
          return resolve();
        }
        const done = () => {
          clearTimeout(timeout);
          pending.delete(done);
          resolve();
        };
        const timeout = setTimeout(done, NAVIGATION_TIMEOUT_MS);
        pending.add(done);
        router.push(href);
      });

    import("@/lib/webmcp-tools")
      .then(({ createTools }) => {
        if (controller.signal.aborted) return;
        const tools = createTools({ navigate, setTheme });
        return Promise.all(tools.map((tool) => modelContext.registerTool(tool, { signal: controller.signal })));
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        // Expose all tools or none: roll back any that did register.
        controller.abort();
        console.warn("[WebMCP] Tool registration failed; no tools are exposed.", error);
      });

    return () => controller.abort();
  }, [router, setTheme]);

  return null;
}
