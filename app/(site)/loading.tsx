export default function Loading() {
  return (
    // `data-route-loading` lets the WebMCP navigation tool wait until the real page has rendered.
    <div data-route-loading className="flex h-screen items-center justify-center">
      <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary-foreground"></div>
    </div>
  );
}
