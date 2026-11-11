import React from "react";
import { Mail } from "lucide-react";

import siteMetadata, { defaultAuthor } from "@/lib/metadata";
import { BracketLabel } from "@/components/ui/frame";
import { CopyButton } from "@/components/copy-button";
import { SocialButton } from "@/components/social-button";

const linkClass = "text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground";

const Footer = () => {
  return (
    <footer className="border-t border-foreground/10">
      <div className="container flex max-w-6xl flex-col gap-6 py-8 pb-28 sm:pb-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <BracketLabel>
            &copy; {new Date().getFullYear()} {defaultAuthor.name}
          </BracketLabel>
          <p className="font-mono text-[11px] text-muted-foreground">
            Source on{" "}
            <a href={siteMetadata.siteRepo} target="_blank" rel="noreferrer" className={linkClass}>
              GitHub
            </a>
            {" · "}
            <a
              href={defaultAuthor.socialProfiles.find((platform) => platform.name === "x")?.link}
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              {defaultAuthor.handle}
            </a>
          </p>
        </div>
        <div className="-ml-2 flex flex-wrap items-center text-muted-foreground md:ml-0">
          {defaultAuthor.socialProfiles.map((platform) => (
            <SocialButton
              key={platform.name}
              variant="ghost"
              size="icon"
              className="hover:bg-transparent hover:text-accent-foreground"
              platform={platform}
            />
          ))}
          <CopyButton
            size="icon"
            variant="ghost"
            className="hover:bg-transparent hover:text-accent-foreground"
            copyText={defaultAuthor.email}
          >
            <Mail />
            <span className="sr-only">Email address</span>
          </CopyButton>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
