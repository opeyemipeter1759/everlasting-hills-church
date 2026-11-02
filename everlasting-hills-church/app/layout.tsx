import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { QueryProvider } from "@/lib/api/QueryProvider";
import NavigationProgress from "@/components/ui/navigation/NavigationProgress";
import { ToastProvider } from "@/lib/api/ToastProvider";
import "./globals.css";
import { SermonPlayerProvider } from "@/context/SermonPlayerContext";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import BirthdayCelebration from "@/components/celebrations/BirthdayCelebration";

// Self-hosted (latin variable fonts from Google Fonts): next/font/google
// fetches at build time and crashes on Google's extensionless font URLs.
const inter = localFont({ src: "./fonts/inter.woff2", weight: "400 700", variable: "--nf-inter", display: "swap" });
const jakarta = localFont({ src: "./fonts/plus-jakarta-sans.woff2", weight: "400 800", variable: "--nf-jakarta", display: "swap" });
const playfair = localFont({
  src: [
    { path: "./fonts/playfair-display.woff2", weight: "400 700", style: "normal" },
    { path: "./fonts/playfair-display-italic.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--nf-playfair",
  display: "swap",
});
const spaceGrotesk = localFont({ src: "./fonts/space-grotesk.woff2", weight: "300 700", variable: "--nf-space-grotesk", display: "swap" });
const dancingScript = localFont({ src: "./fonts/dancing-script.woff2", weight: "600 700", variable: "--nf-dancing", display: "swap" });
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0810" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={FONT_VARIABLES}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(location.pathname.indexOf('/dashboard')!==0)return;var t=localStorage.getItem('ehc-theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()` }} />
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
          sizes="180x180"
          href="/icons/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Everlasting Hills" />
      </head>
      <body className="antialiased bg-white dark:bg-[#111111] transition-colors">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <QueryProvider>
          <SermonPlayerProvider>
            {children}
            <ToastProvider />
            <BirthdayCelebration />
            <InstallPrompt />
          </SermonPlayerProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
