import { brandIconPaths } from "@/lib/brand-icons";

type BrandIconProps = {
  name: string;
  className?: string;
};

// Renders a brand logo from simple-icons paths; renders nothing for unknown brands.
export function BrandIcon({ name, className }: BrandIconProps) {
  const path = brandIconPaths[name.toLowerCase()];
  if (!path) return null;

  return (
    <svg role="img" viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d={path} />
    </svg>
  );
}
