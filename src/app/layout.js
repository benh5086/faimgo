import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
  metadataBase: new URL("https://faimgo.vercel.app"),
  title: {
    default: "Faimgo — find the side income that fits your life",
    template: "%s · Faimgo",
  },
  description:
    "A short, honest assessment that points you at one way to earn on the side — then walks you through the first 90 days, step by step.",
  openGraph: {
    title: "Faimgo — find the side income that fits your life",
    description:
      "A short, honest assessment that points you at one way to earn on the side — then walks you through the first 90 days, step by step.",
    url: "https://faimgo.vercel.app",
    siteName: "Faimgo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Faimgo — find the side income that fits your life",
    description:
      "A short, honest assessment that points you at one way to earn on the side — then walks you through the first 90 days.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
