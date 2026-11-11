"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

import siteMetadata from "@/lib/metadata";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export type CTAProps = {
  title: string;
  description?: string;
  buttonText: string;
};

const INVALID_EMAIL_MESSAGE = "Invalid email address";

const SUCCESS_TOAST = {
  title: "Almost there!",
  description: "Check your inbox to confirm your subscription.",
} as const;

// The description is the server's own message (e.g. rate limited, invalid email).
const FAILURE_TOAST = {
  title: "Something went wrong.",
  variant: "destructive",
} as const;

type NewsletterFormProps = {
  buttonText: string;
  placeholder: string;
  buttonVariant?: ButtonProps["variant"];
  className?: string;
};

// Plain form with native email validation; the /newsletter route re-validates server-side.
function NewsletterForm({ buttonText, placeholder, buttonVariant, className }: NewsletterFormProps) {
  const { toast } = useToast();
  const errorId = React.useId();
  const [invalid, setInvalid] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  // Time-to-submit feeds the server's bot check; set after mount to keep render pure.
  const mountedAtRef = React.useRef(0);
  React.useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      setInvalid(true);
      return;
    }

    const data = new FormData(form);
    startTransition(async () => {
      const result = await subscribeToNewsletter({
        email: String(data.get("email")),
        company: String(data.get("company") ?? ""),
        elapsedMs: Date.now() - mountedAtRef.current,
      });
      if (result.ok) {
        form.reset();
        toast(SUCCESS_TOAST);
      } else {
        toast({ ...FAILURE_TOAST, description: result.error });
      }
    });
  };

  return (
    <form noValidate onSubmit={onSubmit} className={cn("flex w-full flex-col", className)}>
      {/* Honeypot: invisible to people, filled in by naive bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      />
      <div className="flex-auto space-y-2">
        <Input
          type="email"
          name="email"
          required
          placeholder={placeholder}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          onChange={() => setInvalid(false)}
        />
        {invalid ? (
          <p id={errorId} className="text-sm font-medium text-destructive">
            {INVALID_EMAIL_MESSAGE}
          </p>
        ) : null}
      </div>
      <Button type="submit" variant={buttonVariant} disabled={isPending}>
        <Mail className="mr-2 h-4 w-4" /> {buttonText}
      </Button>
    </form>
  );
}

const NewsletterSubscribe = ({
  title,
  description,
  buttonText,
  className,
  ...props
}: CTAProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <section
      className={cn("relative isolate my-24 overflow-hidden bg-primary py-6 text-primary-foreground", className)}
      {...props}
    >
      <div className="p-8 md:p-12">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-heading text-2xl font-bold md:text-3xl">{title}</h2>

          <p className="hidden text-muted-foreground sm:mt-4 sm:block">{description}</p>
        </div>

        <div className="mx-auto mt-8 max-w-xl">
          <NewsletterForm
            buttonText={buttonText}
            placeholder="anakin.skywalker@darksi.de"
            buttonVariant="secondary"
            className="gap-3 md:flex-row"
          />
          {siteMetadata.newsletterUrl && (
            <div className="mt-4 flex items-center justify-center">
              <Button asChild variant="ghost">
                <Link href={siteMetadata.newsletterUrl} target="_blank">
                  Let me read it first <ArrowRight className="mr-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <svg
        viewBox="0 0 1024 1024"
        className="absolute top-1/2 left-1/2 -z-10 h-256 w-5xl -translate-x-1/2"
        aria-hidden="true"
      >
        <circle cx={512} cy={512} r={512} fill="url(#gradient)" fillOpacity="0.7" />
        <defs>
          <radialGradient
            id="gradient"
            cx={0}
            cy={0}
            r={1}
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(512 512) rotate(90) scale(512)"
          >
            <stop stopColor="#7775D6" />
            <stop offset={1} stopColor="#E935C1" stopOpacity={0} />
          </radialGradient>
        </defs>
      </svg>
    </section>
  );
};

export const NewsletterSubscribeInline = ({
  caption,
  buttonText,
  placeholder = "you@example.com",
  className,
  ...props
}: {
  caption?: string;
  buttonText: string;
  placeholder?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("w-full", className)} {...props}>
      {caption && <p className="mb-2 text-sm text-muted-foreground">{caption}</p>}
      <NewsletterForm buttonText={buttonText} placeholder={placeholder} className="gap-2 sm:flex-row" />
    </div>
  );
};

export const NewsletterSubscribeCompact = ({
  title,
  description,
  buttonText,
  className,
  ...props
}: CTAProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <aside
      className={cn(
        "not-prose my-10 rounded-xl border bg-muted/40 p-6 ring-1 ring-border/60 backdrop-blur-xs",
        className
      )}
      {...props}
    >
      <div className="mb-4">
        <h3 className="font-heading text-lg font-semibold">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <NewsletterForm buttonText={buttonText} placeholder="you@example.com" className="gap-2 sm:flex-row" />
    </aside>
  );
};

export default NewsletterSubscribe;
