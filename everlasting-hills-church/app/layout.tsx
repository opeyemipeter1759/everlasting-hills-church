import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter, Plus_Jakarta_Sans, Playfair_Display, Space_Grotesk, Dancing_Script } from "next/font/google";
import { QueryProvider } from "@/lib/api/QueryProvider";
import NavigationProgress from "@/components/ui/navigation/NavigationProgress";
import { ToastProvider } from "@/lib/api/ToastProvider";
import "./globals.css";
import { SermonPlayerProvider } from "@/context/SermonPlayerContext";
import InstallPrompt from "@/components/pwa/InstallPrompt";

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

/**
 * Next injects `width=device-width, initial-scale=1` on its own; this export
 * exists for the two things it does not add.
 *
 * viewportFit: "cover" lets the page paint under the iPhone notch and home
 * indicator, which is what makes env(safe-area-inset-*) resolve to anything
 * other than 0 — the install prompt and the dashboard tab bar both pad
 * themselves with it. themeColor tints the browser chrome around the installed
 * app; the manifest's theme_color only covers the standalone window.
 */
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
        {/* iOS ignores the manifest's icons for the home screen and reads this
            instead. Points at the generated PWA set, whose mark sits on the
            brand's black base — the older /favicon/android-chrome-*.png are a
            white mark on transparency, which iOS composites onto black and
            renders as an almost invisible icon. */}
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
          </SermonPlayerProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
