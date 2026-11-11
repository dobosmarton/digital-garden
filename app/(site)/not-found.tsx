"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { StatusPanel } from "@/components/status-panel";

export default function NotFound() {
  const router = useRouter();

  return (
    <StatusPanel
      code="404"
      status="Page not found"
      title="Something's missing"
      actions={
        <>
          <Button onClick={() => router.back()}>Go back</Button>
          <Button onClick={() => router.push("/")} variant="outline" className="border-foreground/10">
            Back to home
          </Button>
        </>
      }
    >
      Sorry, the page you are looking for doesn&apos;t exist or has been moved.
    </StatusPanel>
  );
}
