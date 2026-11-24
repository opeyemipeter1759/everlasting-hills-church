import Image from "next/image";
import { Icon, EnvelopeSimple, FacebookLogo, InstagramLogo, TiktokLogo, WhatsappLogo, XLogo, YoutubeLogo } from "@/components/icons";
import { getSiteConfig } from "@/lib/site-config";
import { getAllSiteSettings, type ContactContent } from "@/lib/site-settings";

/** Build the visible social links from the CMS "Contact" settings (the same
 * tab admins edit in the site-settings dashboard) — each channel only shows
 * up when its own `visible` toggle is on and it has a URL. */
function buildSocialLinks(contact: ContactContent) {
  return [
    { icon: WhatsappLogo, label: "WhatsApp", href: contact.whatsapp.visible ? contact.whatsapp.url : "" },
    { icon: InstagramLogo, label: "Instagram", href: contact.instagram.visible ? contact.instagram.url : "" },
    { icon: FacebookLogo, label: "Facebook", href: contact.facebook.visible ? contact.facebook.url : "" },
    { icon: YoutubeLogo, label: "YouTube", href: contact.youtube.visible ? contact.youtube.url : "" },
    { icon: XLogo, label: "Twitter / X", href: contact.twitter.visible ? contact.twitter.url : "" },
    { icon: TiktokLogo, label: "TikTok", href: contact.tiktok.visible ? contact.tiktok.url : "" },
    { icon: EnvelopeSimple, label: "Email", href: contact.email.visible && contact.email.address ? `mailto:${contact.email.address}` : "" },
  ].filter((l): l is typeof l & { href: string } => !!l.href && l.href !== "#");
}

type FooterLink = { label: string; href?: string };

// Link columns, grouped by what a visitor is trying to do.
const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Our church",
    links: [
      { label: "About", href: "/about" },
      { label: "Our Culture", href: "/cultures" },
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
      { label: "Prayer Watch", href: "/prayer-watch" },
      { label: "Talk to a Pastor", href: "/talk-to-a-pastor" },
      { label: "Pre-Marital Counselling", href: "/pre-marital-counselling" },
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
    <footer className="relative overflow-visible" style={{ background: "linear-gradient(160deg, #1a0208 0%, #2a0410 40%, #3d0916 100%)" }}>
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
                    <Icon icon={social.icon} size={16} />
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
