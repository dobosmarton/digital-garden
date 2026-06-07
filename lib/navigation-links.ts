import { ContentNavItem, NavItem } from "@/types";

import { projects } from "@/lib/projects-data";

const projectLinks: ContentNavItem[] = projects.map((project) => ({
  title: project.title,
  href: project.href,
  description: project.description,
}));

export const navigationLinks: NavItem[] = [
  {
    title: "Blog",
    href: "/posts",
  },
  {
    title: "Projects",
    content: projectLinks,
  },
];
