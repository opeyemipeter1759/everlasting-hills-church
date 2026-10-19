import Image from "next/image";
import { Instagram, Facebook, Youtube, Mail } from "lucide-react";
import { getSiteConfig } from "@/lib/site-config";
import { getAllSiteSettings, type ContactContent } from "@/lib/site-settings";

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.16 8.16 0 0 0 4.77 1.52V6.82a4.85 4.85 0 0 1-1-.13z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.36c0-4.52 3.68-8.2 8.21-8.2a8.16 8.16 0 0 1 5.8 2.41 8.15 8.15 0 0 1 2.4 5.79c0 4.52-3.68 8.2-8.16 8.22zm4.5-6.14c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.81-.78.97-.14.17-.29.19-.53.06-.25-.12-1.04-.38-1.99-1.23-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.48-.01a.92.92 0 0 0-.67.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.02 2.57.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.9 2H22l-7.6 8.68L23.3 22h-6.9l-5.4-6.7L4.8 22H1.6l8.1-9.28L1 2h7.1l4.9 6.14L18.9 2zm-1.2 18h1.9L7.4 4h-2l12.3 16z" />
    </svg>
  );
}

/** Build the visible social links from the CMS "Contact" settings (the same
 * tab admins edit in the site-settings dashboard) — each channel only shows
 * up when its own `visible` toggle is on and it has a URL. */
function buildSocialLinks(contact: ContactContent) {
  return [
    { icon: WhatsAppIcon, label: "WhatsApp", href: contact.whatsapp.visible ? contact.whatsapp.url : "" },
    { icon: Instagram, label: "Instagram", href: contact.instagram.visible ? contact.instagram.url : "" },
    { icon: Facebook, label: "Facebook", href: contact.facebook.visible ? contact.facebook.url : "" },
    { icon: Youtube, label: "YouTube", href: contact.youtube.visible ? contact.youtube.url : "" },
    { icon: XIcon, label: "Twitter / X", href: contact.twitter.visible ? contact.twitter.url : "" },
    { icon: TikTokIcon, label: "TikTok", href: contact.tiktok.visible ? contact.tiktok.url : "" },
    { icon: Mail, label: "Email", href: contact.email.visible && contact.email.address ? `mailto:${contact.email.address}` : "" },
  ].filter((l): l is typeof l & { href: string } => !!l.href && l.href !== "#");
}

type FooterLink = { label: string; href?: string };

// Link columns, grouped by what a visitor is trying to do.
const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Our church",
    links: [
      { label: "About", href: "/about" },
      { label: "What We Believe", href: "/beliefs" },
      { label: "Ministries", href: "/ministries" },
      { label: "Sermons", href: "/sermons" },
      { label: "Articles", href: "/articles" },
    ],
  },
  {
    title: "Get involved",
    links: [
      { label: "Plan a Visit", href: "/visit" },
      { label: "Home Cell", href: "/connect/home-cell" },
      { label: "Give", href: "/give" },
      { label: "Project Pledge", href: "/pledge" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    // Only the Membership Class has a public page so far; the rest read as
    // "Soon" until theirs is built (give one an href to turn it into a link).
    title: "Classes",
    links: [
      { label: "Believers" },
      { label: "Membership", href: "/classes/membership" },
      { label: "Foundation" },
      { label: "Discipleship" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "First Timers", href: "/first-timer" },
      { label: "Prayer Request", href: "/prayer-request" },
      { label: "Welfare Request", href: "/welfare" },
      { label: "Testimony", href: "/testimony" },
      { label: "Questions", href: "/questions" },
    ],
  },
];

const linkClass =
  "inline-block rounded text-sm text-white/65 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB3C1]";

export default async function Footer() {
  const [cfg, settings] = await Promise.all([getSiteConfig(), getAllSiteSettings()]);
  const socialLinks = buildSocialLinks(settings.CONTACT);
  return (
    <footer
      className="relative overflow-visible"
      style={{ background: "linear-gradient(160deg, #1a0208 0%, #2a0410 40%, #3d0916 100%)" }}
    >
      <div className="h-px bg-gradient-to-r from-transparent via-[#87102C] to-transparent" />

      {/* Faint mountains */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden opacity-[0.04]">
        <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className="w-full">
          <path d="M0,180 L240,60 L480,130 L720,40 L960,110 L1200,50 L1440,100 L1440,180 Z" fill="white" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 xs:px-5 sm:px-8 pt-28 pb-8 sm:pt-32">
        {/* Who we are, and the one thing we would like you to do */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-6 flex items-center gap-3">
              <Image src="/logo.png" alt="Everlasting Hills Church Logo" width={44} height={44} className="flex-shrink-0" />
              <p className="text-base font-semibold text-white">Everlasting Hills Church</p>
            </div>
            <p className="font-serif text-2xl leading-snug text-white/90 sm:text-3xl text-balance">{cfg.footerTagline}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/visit"
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#1a0208] transition-colors hover:bg-[#FFE8ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB3C1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2a0410]"
            >
              Plan a visit
            </a>
            <a
              href="/give"
              className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB3C1]"
            >
              Give
            </a>
          </div>
        </div>

        <div className="my-12 h-px bg-white/10" />

        {/* Links */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.3fr_repeat(4,1fr)] lg:gap-x-8">
          <div className="col-span-2 lg:col-span-1">
            <h2 className="mb-4 font-serif text-base text-[#FFB3C1]">Find us</h2>
            <p className="max-w-[16rem] text-sm leading-relaxed text-white/65">{cfg.address}</p>
            {socialLinks.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2.5">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/60 transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB3C1]"
                  >
                    <social.icon size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-4 font-serif text-base text-[#FFB3C1]">{col.title}</h2>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a href={link.href} className={linkClass}>
                        {link.label}
                      </a>
                    ) : (
                      <span className="text-sm text-white/35">
                        {link.label} <span className="text-xs text-white/30">· Soon</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Everlasting Hills Church. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="text-xs text-white/40 transition-colors hover:text-white/70">
              Privacy
            </a>
            <a href="/terms" className="text-xs text-white/40 transition-colors hover:text-white/70">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
