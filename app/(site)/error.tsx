"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { StatusPanel } from "@/components/status-panel";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPanel
      code="Error"
      status="Something broke"
      title="Something went wrong"
      actions={
        <>
          <Button onClick={() => reset()}>Try again</Button>
          <Button onClick={() => router.push("/")} variant="outline" className="border-foreground/10">
            Back to home
          </Button>
        </>
      }
    >
      The page failed to load. Trying again usually fixes it.
    </StatusPanel>
  );
}
