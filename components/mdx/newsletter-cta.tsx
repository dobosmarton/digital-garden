import { NewsletterSubscribeCompact } from "../newsletter-subscribe";
import type { CTAProps } from "../newsletter-subscribe";

export function NewsletterCTA(props: CTAProps & React.HTMLAttributes<HTMLDivElement>) {
  return <NewsletterSubscribeCompact {...props} />;
}
