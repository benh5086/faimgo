import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "../lib/i18n/LocaleContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* Until now every browser tab and every shared link said "Create Next App".
   Cheap to fix, and it is the first thing anyone sees before the site loads. */
export const metadata = {
  metadataBase: new URL("https://faimgo.com"),
  title: {
    default: "Faimgo — find the supplemental income that fits your life",
    template: "%s · Faimgo",
  },
  description:
    "A short, honest assessment that points you at one way to earn supplemental income — then walks you through the first 90 days, step by step.",
  openGraph: {
    title: "Faimgo — find the supplemental income that fits your life",
    description:
      "A short, honest assessment that points you at one way to earn supplemental income — then walks you through the first 90 days, step by step.",
    url: "https://faimgo.com",
    siteName: "Faimgo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Faimgo — find the supplemental income that fits your life",
    description:
      "A short, honest assessment that points you at one way to earn supplemental income — then walks you through the first 90 days.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Impact.com site-ownership verification (added Sep 13 2026 for the
            affiliate enrollment — see claude/faimgo-affiliate-checklist.md).
            Impact's verifier looks for the `value` attribute specifically, so
            this is rendered as a raw head tag rather than via the metadata API
            (which would emit `content`). It's a public verification token, not
            a secret. One Impact verification covers every Impact-run program
            (CapCut, and commonly Canva/Calendly too). */}
        <meta name="impact-site-verification" value="c0124b3e-4a1b-487a-86a6-f756ac8db330" />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Wraps the whole app so any page can eventually opt into
            useLocale(), not just the homepage — but only the homepage
            actually reads translated strings today. See LocaleContext.js
            for the reasoning on what's translated now vs. deferred. */}
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
