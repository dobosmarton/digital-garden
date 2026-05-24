import "./globals.css";

import { Metadata } from "next";
import { Inter, Karla } from "next/font/google";

import siteMetadata, { BASE_URL, defaultAuthor } from "@/lib/metadata";
import { personJsonLd, twitterHandle, websiteJsonLd } from "@/lib/seo";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@/components/analytics";
import { BackTopButton } from "@/components/back-to-top";
import { ThemeProvider } from "@/components/theme-provider";

const spaceGrotesk = Karla({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space",
  weight: ["400", "600", "700"],
});
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: siteMetadata.title,
  description: siteMetadata.description,
  authors: [{ name: defaultAuthor.name, url: defaultAuthor.website }],
  alternates: {
    canonical: "./",
    types: {
      "application/rss+xml": `${BASE_URL}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: siteMetadata.title.default,
    title: siteMetadata.title.default,
    description: siteMetadata.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: twitterHandle,
    creator: twitterHandle,
    title: siteMetadata.title.default,
    description: siteMetadata.description,
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const websiteLd = websiteJsonLd(siteMetadata.title.default, siteMetadata.description);
  const personLd = personJsonLd();

  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-slate-100 to-white text-slate-900 antialiased dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800 dark:text-slate-50">
        <ThemeProvider attribute="class" defaultTheme={siteMetadata.defaultTheme} enableSystem>
          {children}
          <BackTopButton />
          <Toaster />
        </ThemeProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      </body>
      <Analytics />
    </html>
  );
}
