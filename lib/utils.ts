import { clsx, type ClassValue } from "clsx";
import { Post } from "contentlayer/generated";
import { compareDesc } from "date-fns";
import { twMerge } from "tailwind-merge";

import siteMetadata from "./metadata";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateReadingTime = (text: string): number => {
  const wordsPerMinute = 200; // Average humans read about 200-250 words per minute.
  const noOfWords = text.split(/\s/g).length;

  const minutes = noOfWords / wordsPerMinute;
  const readTime = Math.ceil(minutes);

  return readTime;
};

export const getTagsWithCount = (posts: Post[]) =>
  posts.reduce((acc: any, post: Post) => {
    post.tags?.forEach((tag: any) => {
      if (acc[tag]) {
        acc[tag] += 1;
      } else {
        acc[tag] = 1;
      }
    });
    return acc;
  }, {});

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number, immediate?: boolean) {
  let timeout: ReturnType<typeof setTimeout> | null;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const context = this;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout!);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

export const sortByDate = (a: Post, b: Post) =>
  compareDesc(new Date(a.lastUpdatedDate || a.publishedDate), new Date(b.lastUpdatedDate || b.publishedDate));

// Sort posts newest-first, keeping a series together with its latest part first.
// A series is anchored to its most recent part (so it bubbles up by recency), and
// parts within it sort descending — the latest part leads the group.
export const sortPosts = (posts: Post[]): Post[] => {
  const dateOf = (p: Post) => new Date(p.lastUpdatedDate || p.publishedDate).getTime();

  const seriesAnchor = new Map<string, number>();
  for (const post of posts) {
    const title = post.series?.title;
    if (!title) continue;
    seriesAnchor.set(title, Math.max(seriesAnchor.get(title) ?? -Infinity, dateOf(post)));
  }

  const anchorOf = (p: Post) => (p.series?.title ? seriesAnchor.get(p.series.title)! : dateOf(p));

  return [...posts].sort((a, b) => {
    const byAnchor = anchorOf(b) - anchorOf(a);
    if (byAnchor !== 0) return byAnchor;

    const aTitle = a.series?.title;
    const bTitle = b.series?.title;
    // same series → latest part first (descending)
    if (aTitle && aTitle === bTitle) return Number(b.series!.order) - Number(a.series!.order);
    // different series sharing an anchor date → keep each grouped, stable by title
    if (aTitle && bTitle) return aTitle.localeCompare(bTitle);
    // fall back to own date, newest first
    return dateOf(b) - dateOf(a);
  });
};

export const pageCount = (number: number) => Math.ceil(number / siteMetadata.postsPerPage);
