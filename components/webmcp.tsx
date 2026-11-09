"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const NAVIGATION_TIMEOUT_MS = 10_000;

// The App Router commits the new URL together with the route's loading.tsx fallback
// (marked `data-route-loading`) and streams the page and its <title> in afterwards.
const isPageReady = (pathname: string) =>
  window.location.pathname === pathname && document.title !== "" && !document.querySelector("[data-route-loading]");

// Resolves once `pathname` has fully rendered, or after a timeout.
function waitForPage(pathname: string): Promise<void> {
  return new Promise((resolve) => {
    if (isPageReady(pathname)) return resolve();

    const finish = () => {
      observer.disconnect();
      clearTimeout(timeout);
      resolve();
    };
    const observer = new MutationObserver(() => isPageReady(pathname) && finish());
    const timeout = setTimeout(finish, NAVIGATION_TIMEOUT_MS);
    observer.observe(document, { subtree: true, childList: true, characterData: true });
  });
}

// Exposes the site to in-browser AI agents via WebMCP. Renders nothing. The tool
// definitions are only downloaded in browsers that implement `document.modelContext`.
export function WebMCP() {
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext) return;

    const controller = new AbortController();

    const navigate = (href: string) => {
      router.push(href);
      return waitForPage(new URL(href, window.location.href).pathname);
    };

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
