import Image from "next/image";
import { Instagram, Facebook, Youtube, Mail } from "lucide-react";
import { getSiteConfig, type SiteIdentity } from "@/lib/site-config";

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.16 8.16 0 0 0 4.77 1.52V6.82a4.85 4.85 0 0 1-1-.13z" />
    </svg>
  );
}

/** Build the visible social links from CMS site settings (hides empty channels). */
function buildSocialLinks(cfg: SiteIdentity) {
  const s = cfg.socials;
  return [
    { icon: Instagram, label: "Instagram", href: s.instagram },
    { icon: Facebook, label: "Facebook", href: s.facebook },
    { icon: Youtube, label: "YouTube", href: s.youtube },
    { icon: TikTokIcon, label: "TikTok", href: s.tiktok },
    { icon: Mail, label: "Email", href: cfg.contactEmail ? `mailto:${cfg.contactEmail}` : "" },
  ].filter((l) => l.href);
}

const footerLinks = [
  { label: "About", href: "/about" },
  { label: "What We Believe", href: "/beliefs" },
  { label: "Ministries", href: "/ministries" },
  { label: "Sermons", href: "/sermons" },
  { label: "Home Cell", href: "/connect/home-cell" },
  { label: "Plan a Visit", href: "/visit" },
  { label: "Give", href: "/give" },
  { label: "Contact", href: "/contact" },
];

export default async function Footer() {
  const cfg = await getSiteConfig();
  const socialLinks = buildSocialLinks(cfg);
  return (
    <footer
      className="relative overflow-visible"
      style={{
        background:
          "linear-gradient(160deg, #1a0208 0%, #2a0410 40%, #3d0916 100%)",
      }}
    >
      {/* Top border accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#87102C] to-transparent" />

      {/* Faint mountains */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden opacity-[0.04]">
        <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className="w-full">
          <path d="M0,180 L240,60 L480,130 L720,40 L960,110 L1200,50 L1440,100 L1440,180 Z" fill="white" />
        </svg>
      </div>

      <div className="relative  max-w-6xl mx-auto px-5 sm:px-8 pt-32 pb-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
          {/* Brand block */}
          <div className="lg:col-span-1">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-5">
              <Image src="/logo.png" alt="Everlasting Hills Church Logo" width={48} height={48} className="flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-sm leading-none">
                  Everlasting Hills
                </p>
                <p className="text-white/40 text-[10px] tracking-[0.15em] uppercase mt-0.5">
                  Church
                </p>
              </div>
            </div>

            {/* Tagline */}
            <p className="text-white/60 text-sm leading-relaxed mb-4 max-w-[230px]">
              {/* ── Church tagline (CMS site settings) ── */}
              {cfg.footerTagline}
            </p>

            {/* Pillars */}
            <div className="flex items-center gap-0 mb-6">
              {["Word", "Spirit", "Community"].map((p, i) => (
                <span key={p} className="flex items-center">
                  <span className="text-white/30 text-xs tracking-[0.12em] uppercase">
                    {p}
                  </span>
                  {i < 2 && (
                    <span className="w-px h-2.5 bg-white/15 mx-3" />
                  )}
                </span>
              ))}
            </div>

            {/* Location */}
            <p className="text-white/35 text-xs tracking-wide">
              {cfg.address}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-white/50 text-xs tracking-[0.2em] uppercase font-medium mb-5">
              Quick Links
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-white/55 text-sm hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <p className="text-white/50 text-xs tracking-[0.2em] uppercase font-medium mb-5">
              Connect
            </p>
            <div className="flex gap-3 mb-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all duration-200"
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
            <p className="text-white/35 text-xs leading-relaxed">
              {/* ── Small note in footer ── */}
              Follow us for updates, sermons, and encouragement throughout the
              week.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/25 text-xs">
            &copy; {new Date().getFullYear()} Everlasting Hills Church. All
            rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="/privacy"
              className="text-white/25 text-xs hover:text-white/60 transition-colors"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="text-white/25 text-xs hover:text-white/60 transition-colors"
            >
              Terms
            </a>
            <span className="text-white/20 text-xs">{cfg.address}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
