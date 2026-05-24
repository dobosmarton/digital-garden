import { BASE_URL, defaultAuthor } from "./metadata";

const twitterProfile = defaultAuthor.socialProfiles.find((p) => p.name === "x" || p.name === "twitter");

export const twitterHandle = twitterProfile
  ? `@${twitterProfile.link.replace(/\/$/, "").split("/").pop()}`
  : defaultAuthor.handle;

export const postUrl = (slug: string) => `${BASE_URL}/posts/${slug}`;
export const tagUrl = (tag: string) => `${BASE_URL}/tags/${tag}`;

type Author = { name?: string; url?: string };

type PostLike = {
  title: string;
  description?: string;
  slug: string;
  publishedDate: string;
  lastUpdatedDate?: string;
  tags?: string[];
  coverImage?: string;
  author?: Author;
};

export const personJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Person",
  name: defaultAuthor.name,
  url: BASE_URL,
  email: `mailto:${defaultAuthor.email}`,
  jobTitle: defaultAuthor.jobTitle,
  image: `${BASE_URL}/profile.jpg`,
  sameAs: defaultAuthor.socialProfiles.map((p) => p.link),
});

export const websiteJsonLd = (siteName: string, description: string) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  description,
  url: BASE_URL,
  inLanguage: "en",
  author: { "@type": "Person", name: defaultAuthor.name, url: BASE_URL },
  publisher: { "@type": "Person", name: defaultAuthor.name, url: BASE_URL },
});

export const blogPostingJsonLd = (post: PostLike) => {
  const url = postUrl(post.slug);
  const image = post.coverImage ? [post.coverImage] : [`${url}/opengraph-image`];
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: post.publishedDate,
    dateModified: post.lastUpdatedDate || post.publishedDate,
    image,
    keywords: post.tags,
    inLanguage: "en",
    author: {
      "@type": "Person",
      name: post.author?.name || defaultAuthor.name,
      url: post.author?.url || BASE_URL,
    },
    publisher: {
      "@type": "Person",
      name: defaultAuthor.name,
      url: BASE_URL,
    },
  };
};

export const breadcrumbJsonLd = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
});
