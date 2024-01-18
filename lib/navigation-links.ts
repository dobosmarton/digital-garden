import { ContentNavItem, NavItem } from "@/types";

import siteMetadata, { defaultAuthor } from "@/lib/metadata";

const content: ContentNavItem[] = [
  {
    title: "Blog",
    href: "/posts",
    description: "Blogposts. Mostly about web development. Or chicken fingers",
  },
];

export const navigationLinks: NavItem[] = [
  {
    title: "Blog",
    href: "/posts",
  },
  /*  {
    title: "Projects",
    href: "/projects",
  }, */
];
