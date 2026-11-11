"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert, Mail } from "lucide-react";

import siteMetadata from "@/lib/metadata";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cellClass, CellHeader, Corners } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export type CTAProps = {
  title: string;
  description?: string;
  buttonText: string;
};

const INVALID_EMAIL_MESSAGE = "Enter a valid email address.";

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
  // The bordered group around the field and button. The error message renders below it,
  // so the group never stretches.
  groupClassName?: string;
  rowClassName?: string;
  header?: React.ReactNode;
};

// Plain form with native email validation; the /newsletter route re-validates server-side.
function NewsletterForm({ buttonText, placeholder, groupClassName, rowClassName, header }: NewsletterFormProps) {
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
    <form noValidate onSubmit={onSubmit} className="w-full">
      {/* Honeypot: invisible to people, filled in by naive bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      />
      <div className={cn(groupClassName, invalidGroup)}>
        {header}
        <div className={cn("flex flex-col", rowClassName)}>
          <Input
            type="email"
            name="email"
            required
            placeholder={placeholder}
            className="min-w-0 flex-auto border-0 bg-transparent px-2 focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-invalid={invalid}
            aria-describedby={invalid ? errorId : undefined}
            onChange={() => setInvalid(false)}
          />
          <Button type="submit" disabled={isPending} className="shrink-0">
            <Mail className="mr-2 h-4 w-4" /> {buttonText}
          </Button>
        </div>
      </div>
      {invalid ? (
        <p id={errorId} className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
          <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {INVALID_EMAIL_MESSAGE}
        </p>
      ) : null}
    </form>
  );
}

// Focus lands on the whole field group: blue border and a soft ring, so the input drops its own.
const focusRing =
  "transition-[border-color,box-shadow] duration-200 focus-within:border-accent-foreground/50 focus-within:shadow-[0_0_0_3px_hsl(var(--accent-foreground)/0.15)]";
// An invalid email turns the group red, focused or not.
const invalidGroup =
  "has-[[aria-invalid=true]]:border-destructive/60 focus-within:has-[[aria-invalid=true]]:border-destructive/60 focus-within:has-[[aria-invalid=true]]:shadow-[0_0_0_3px_hsl(var(--destructive)/0.12)]";

function FieldGroup({ buttonText, placeholder }: { buttonText: string; placeholder: string }) {
  return (
    <NewsletterForm
      buttonText={buttonText}
      placeholder={placeholder}
      groupClassName={cn("rounded-md border border-foreground/10 bg-background", focusRing)}
      rowClassName="gap-2 p-1.5 sm:flex-row"
    />
  );
}

// The full-width call to action at the bottom of pages: a cell with the pitch on one side
// and the form on the other.
const NewsletterSubscribe = ({
  title,
  description,
  buttonText,
  className,
  ...props
}: CTAProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <section className={cn("container my-24 max-w-6xl", className)} {...props}>
      <div className="relative">
        <Corners className="text-foreground/25" />
        <div className={cellClass}>
          <CellHeader label="Newsletter" aside="One email per new post" />
          <div className="grid items-center gap-8 p-6 md:grid-cols-2 md:p-10">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">{title}</h2>
              {description && <p className="mt-3 text-muted-foreground">{description}</p>}
            </div>
            <div>
              <FieldGroup buttonText={buttonText} placeholder="you@example.com" />
              {siteMetadata.newsletterUrl && (
                <Link
                  href={siteMetadata.newsletterUrl}
                  target="_blank"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-accent-foreground hover:underline"
                >
                  Let me read it first <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// The hero's subscribe box: a header strip over the field and button, focus on the whole cell.
export const NewsletterSubscribeInline = ({
  label = "Newsletter",
  caption,
  buttonText,
  placeholder = "you@example.com",
  className,
  ...props
}: {
  label?: string;
  caption?: string;
  buttonText: string;
  placeholder?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("w-full", className)} {...props}>
      <NewsletterForm
        buttonText={buttonText}
        placeholder={placeholder}
        groupClassName={cn(cellClass, focusRing)}
        rowClassName="gap-2 p-2 sm:flex-row"
        header={<CellHeader label={label} aside={caption} />}
      />
    </div>
  );
};

// The in-post call to action used from MDX.
export const NewsletterSubscribeCompact = ({
  title,
  description,
  buttonText,
  className,
  ...props
}: CTAProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <aside className={cn("not-prose my-10", cellClass, className)} {...props}>
      <CellHeader label="Newsletter" aside="One email per new post" />
      <div className="p-5">
        <h3 className="font-heading text-lg font-semibold">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-4">
          <FieldGroup buttonText={buttonText} placeholder="you@example.com" />
        </div>
      </div>
    </aside>
  );
};

export default NewsletterSubscribe;
