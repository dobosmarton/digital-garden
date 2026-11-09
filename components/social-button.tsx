import Link from "next/link";
import { SocialProfile } from "@/types";

import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";
import { BrandIcon } from "@/components/brand-icon";

interface SocialButtonProps extends ButtonProps {
  platform: SocialProfile;
}

export function SocialButton({ platform, ...props }: SocialButtonProps) {
  const platformCamel = platform.name.toLocaleLowerCase().charAt(0).toUpperCase() + platform.name.slice(1);

  return (
    <Button asChild {...props}>
      <Link href={platform.link} rel={platform.name === "mastodon" ? "me" : "noreferrer noopener"} target="_blank">
        <BrandIcon name={platform.name} className="h-5 w-5" />
        <span className={cn(props.size === "icon" ? "sr-only" : "ml-2")}>Go to my {platformCamel} profile</span>
      </Link>
    </Button>
  );
}
