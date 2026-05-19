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
        {/* Preconnect for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
