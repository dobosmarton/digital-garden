// Client-side newsletter service shared by the subscribe forms and the
// WebMCP `subscribe_newsletter` tool, so both go through the same path.

export type SubscribeRequest = {
  email: string;
  company?: string;
  elapsedMs?: number;
};

export type SubscribeResult = { ok: true } | { ok: false; error: string };

export async function subscribeToNewsletter(request: SubscribeRequest, signal?: AbortSignal): Promise<SubscribeResult> {
  try {
    const response = await fetch("/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
    if (response.ok) return { ok: true };

    const body: { error?: string } | null = await response.json().catch(() => null);
    return { ok: false, error: body?.error ?? `Subscription failed (HTTP ${response.status}).` };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}
