import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Plus_Jakarta_Sans, Playfair_Display, Space_Grotesk, Dancing_Script } from "next/font/google";
import { QueryProvider } from "@/lib/api/QueryProvider";
import NavigationProgress from "@/components/ui/navigation/NavigationProgress";
import { ToastProvider } from "@/lib/api/ToastProvider";
import "./globals.css";
import { SermonPlayerProvider } from "@/context/SermonPlayerContext";

// Self-hosted at build time instead of the old `@import url(fonts.googleapis.com/...)`
// in globals.css, which was render-blocking: the browser had to fetch that
// external stylesheet (its own DNS+TLS+request round trip) before it could
// finish parsing CSS at all. next/font inlines the @font-face rules and
// serves the font files from this origin, with the same weights/styles the
// @import previously requested.
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--nf-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--nf-jakarta", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--nf-playfair", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--nf-space-grotesk", display: "swap" });
const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["600", "700"], variable: "--nf-dancing", display: "swap" });
const FONT_VARIABLES = `${inter.variable} ${jakarta.variable} ${playfair.variable} ${spaceGrotesk.variable} ${dancingScript.variable}`;

export const metadata: Metadata = {
  title: "Everlasting Hills Church — Raising Men Who Flourish Beyond Limits",
  description:
    "A Word-centered, Spirit-filled, and community-focused church in Ibadan, Nigeria. Rooted in Genesis 49:22–26.",  openGraph: {
    title: "Everlasting Hills Church",
    description: "Raising men who flourish beyond limits",
    siteName: "Everlasting Hills Church",
    locale: "en_NG",
    type: "website",
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={FONT_VARIABLES}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ehc-theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()` }} />
       <link rel="icon" href="/favicon/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="apple-touch-icon"
          type="image/png"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="apple-touch-icon"
          type="image/png"
          sizes="192x192"
          href="/favicon/android-chrome-192x192.png"
        />
        <link
          rel="apple-touch-icon"
          type="image/png"
          sizes="512x512"
          href="/favicon/android-chrome-512x512.png"
        />
      </head>
      <body className="antialiased bg-white dark:bg-[#111111] transition-colors">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <QueryProvider>
          <SermonPlayerProvider>
            {children}
            <ToastProvider />
          </SermonPlayerProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
