import { AuthorType, SiteMetaData } from "@/types";

import { socialProfiles } from "./social-data";

export const BASE_URL =
  `https://${process.env.VERCEL_URL}` ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  `http://localhost:${process.env.PORT || 3000}`;

export const defaultAuthor: AuthorType = {
  name: "Marton Dobos",
  handle: "@martondobos",
  socialProfiles,
  email: "martondobos92@gmail.com",
  website: "https://martondobos.com",
  jobTitle: "Full-Stack software engineer",
  availableForWork: false,
  location: {
    city: "Budapest",
    media: "/budapest.jpg",
  },
};

const defaultTitle = `${defaultAuthor.name}'s Blog`;
const defaultDescription = `I'm ${defaultAuthor.name}. I build staff on the internet.`;

const siteMetadata: SiteMetaData = {
  title: {
    template: `%s | ${defaultTitle}`,
    default: defaultTitle,
  },
  description: defaultDescription,
  siteRepo: "https://github.com/dobosmarton/digital-garden",
  defaultTheme: "system",
  activeAnnouncement: false,
  announcement: {
    buttonText: "",
    link: "",
  },
  postsPerPage: 10,
  postsOnHomePage: 8,
  projectsOnHomePage: 4,
};

export default siteMetadata;
