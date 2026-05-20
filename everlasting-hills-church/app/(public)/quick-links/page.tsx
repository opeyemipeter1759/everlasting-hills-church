import Link from "next/link";
import { MessageSquare, Star, Sparkles, Mail, Gift, ArrowRight } from "lucide-react";

const LINKS = [
  {
    href: "/first-timer",
    icon: Star,
    label: "First Timer Form",
    description: "Visited for the first time? Let us get to know you.",
    accent: "#FFB3C1",
    bg: "bg-[#87102C]/20",
    border: "border-[#87102C]/30",
  },
  {
    href: "/prayer-request",
    icon: MessageSquare,
    label: "Prayer Request",
    description: "Submit your petitions. Our intercessors will stand with you.",
    accent: "#FFB3C1",
    bg: "bg-white/5",
    border: "border-white/10",
  },
  {
    href: "/testimony",
    icon: Sparkles,
    label: "Share Testimony",
    description: "Tell us what God has done. Your story encourages the whole family.",
    accent: "#FFB3C1",
    bg: "bg-white/5",
    border: "border-white/10",
  },
  {
    href: "/contact",
    icon: Mail,
    label: "Contact Us",
    description: "Questions, feedback, or just want to say hello.",
    accent: "#FFB3C1",
    bg: "bg-white/5",
    border: "border-white/10",
  },
  {
    href: "/give",
    icon: Gift,
    label: "Give Online",
    description: "Support the work of Everlasting Hills Church.",
    accent: "#FFB3C1",
    bg: "bg-white/5",
    border: "border-white/10",
  },
];

export default function QuickLinksPage() {
  return (
    <main className="min-h-screen bg-church-dark text-white py-20 px-5">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <p className="text-[10px] uppercase tracking-[0.4em] text-church-accent font-black mb-4">
            Quick Links
          </p>
          <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight leading-tight mb-4">
            How can we<br />
            <span className="font-serif italic font-normal text-church-accent">serve you?</span>
          </h1>
          <p className="text-white/50 text-base leading-relaxed">
            Select a form below to get started. We read every submission.
          </p>
        </div>

        <div className="space-y-3">
          {LINKS.map(({ href, icon: Icon, label, description, bg, border }) => (
            <Link
              key={href}
              href={href}
              className={`group flex items-center justify-between gap-4 p-5 rounded-2xl border ${bg} ${border} hover:border-church-accent/40 hover:bg-church-maroon/10 transition-all duration-300`}
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-church-accent/20 transition-colors">
                  <Icon size={18} className="text-church-accent" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{label}</p>
                  <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{description}</p>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-white/20 group-hover:text-church-accent group-hover:translate-x-1 transition-all flex-shrink-0"
              />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
