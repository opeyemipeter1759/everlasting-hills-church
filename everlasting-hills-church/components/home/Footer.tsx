import { Instagram, Facebook, Youtube, Mail } from "lucide-react";

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.16 8.16 0 0 0 4.77 1.52V6.82a4.85 4.85 0 0 1-1-.13z" />
    </svg>
  );
}

const socialLinks = [
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://www.instagram.com/everlastinghillschurch?igsh=d2YwOWJlc2FtZnNs",
  },
  {
    icon: Facebook,
    label: "Facebook",
    href: "https://www.facebook.com/share/1AwdEL3f52/",
  },
  {
    icon: Youtube,
    label: "YouTube",
    href: "https://youtube.com/@everlastinghillschurch?si=3ftJeVz2a6F7Hu3g",
  },
  {
    icon: TikTokIcon,
    label: "TikTok",
    href: "https://www.tiktok.com/@everlasting_hills_church",
  },
  {
    icon: Mail,
    label: "Email",
    href: "mailto:hello@everlastinghills.org",
  },
];

const footerLinks = [
  { label: "About", href: "#about" },
  { label: "Our Culture", href: "#culture" },
  { label: "Sermons", href: "#sermons" },
  { label: "Services", href: "#services" },
  { label: "Community", href: "#community" },
  { label: "Contact", href: "#contact" },
];

export default function Footer() {
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
            {/* Logo mark */}
            <div className="flex items-center gap-2.5 mb-5">
              <svg
                width="36"
                height="36"
                viewBox="0 0 40 40"
                fill="none"
                aria-hidden="true"
              >
                <path d="M4 32L20 8L36 32H4Z" fill="white" opacity="0.1" />
                <path d="M11 32L20 14L29 32H11Z" fill="white" opacity="0.3" />
                <path d="M16 32L20 22L24 32H16Z" fill="white" opacity="0.8" />
              </svg>
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
              {/* ── Church tagline ── */}
              Raising men who flourish beyond limits.
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
              Ibadan, Nigeria {/* ← Update with specific address when ready */}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-white/50 text-xs tracking-[0.2em] uppercase font-medium mb-5">
              Quick Links
            </p>
            <ul className="space-y-3">
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
          <p className="text-white/20 text-xs">
            {/* ── Footer credit — remove or update ── */}
            Ibadan, Nigeria
          </p>
        </div>
      </div>
    </footer>
  );
}
