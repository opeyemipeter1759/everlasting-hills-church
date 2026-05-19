import { Instagram, MessageCircle, Mail } from "lucide-react";

// ── Update social links here ──
const socialLinks = [
  {
    icon: Instagram,
    label: "Instagram",
    href: "#", // ← Replace with your Instagram URL
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    href: "#", // ← Replace with your WhatsApp link
  },
  {
    icon: Mail,
    label: "Email",
    href: "mailto:hello@everlastinghills.org", // ← Replace with your email
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

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-32 pb-10">
        <div className="absolute left-1/2 top-0 z-20 w-full max-w-6xl -translate-x-1/2 -translate-y-1/2 px-4 sm:px-0 overflow-visible">
          <div className="relative overflow-hidden rounded-[36px] border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.25)] px-6 py-7 sm:px-8 sm:py-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(231,116,119,0.18),transparent_40%)]" />
            <div className="pointer-events-none absolute -bottom-10 right-8 h-32 w-32 rounded-full bg-church-accent/15 blur-2xl" />
            <div className="pointer-events-none absolute top-8 left-8 h-24 w-24 rounded-full border border-white/10 bg-white/5" />

            <div className="relative grid gap-6 lg:grid-cols-[1.7fr_1fr] items-start">
              <div className="space-y-5">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-white/60 shadow-inner shadow-black/20">
                  Support our mission
                </div>
                <div>
                  <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-tight">
                    Give with purpose, hope, and quiet confidence.
                  </h2>
                  <p className="mt-4 max-w-xl text-white/65 leading-relaxed">
                    Your gift helps fuel pastoral care, outreach, and the next
                    season of building at Everlasting Hills Church. Every gift
                    counts toward impact in our city.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Secure giving", value: "Fast + encrypted" },
                    { label: "Flexible options", value: "Online or in person" },
                    { label: "Community-led", value: "Every gift matters" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-3xl border border-white/10 bg-[#12050a]/90 p-4">
                      <p className="text-white/40 text-[11px] uppercase tracking-[0.35em] mb-1">
                        {item.label}
                      </p>
                      <p className="text-white text-sm font-semibold">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#12050a]/95 p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                <p className="text-white/50 text-xs uppercase tracking-[0.25em] font-semibold mb-5">
                  Ready to give?
                </p>
                <div className="space-y-5">
                  {[
                    {
                      title: "Give online",
                      description: "Fast checkout that supports recurring or one-time gifts.",
                    },
                    {
                      title: "Weekend offering",
                      description: "Bring your gift to service and bless the church family.",
                    },
                    {
                      title: "Designated project",
                      description: "Choose building, outreach, or local care support.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-3xl border border-white/5 bg-white/5 p-4">
                      <p className="text-white font-semibold">{item.title}</p>
                      <p className="mt-2 text-white/55 text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#"
                    className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-church-dark shadow-lg shadow-church-accent/10 transition hover:bg-white/95"
                  >
                    Give Now
                  </a>
                  <a
                    href="#"
                    className="inline-flex items-center justify-center rounded-full border border-church-accent bg-church-accent/10 px-6 py-3 text-sm font-semibold text-church-accent transition hover:bg-church-accent/20"
                  >
                    Building Project
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

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
