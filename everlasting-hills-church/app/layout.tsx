import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Everlasting Hills Church — Raising Men Who Flourish Beyond Limits",
  description:
    "A Word-centered, Spirit-filled, and community-focused church in Ibadan, Nigeria. Rooted in Genesis 49:22–26.",
  // Update these with real values when deploying
  openGraph: {
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ehc-theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()` }} />
        {/* Preconnect for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
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
      <body className="antialiased bg-white dark:bg-[#111111] transition-colors">{children}</body>
    </html>
  );
}
