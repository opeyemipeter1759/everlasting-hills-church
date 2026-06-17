"use client";

import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import GetInTouch from "./GetInTouch";
import {
  Facebook,
  Mail,
  MessageCircle,
  Instagram,
  Send,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { CONTACT_FALLBACK, type ContactContent } from "@/lib/site-settings";

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.16 8.16 0 0 0 4.77 1.52V6.82a4.85 4.85 0 0 1-1-.13z" />
    </svg>
  );
}

type ContactLink = {
  icon: LucideIcon | typeof TikTokIcon;
  label: string;
  value: string;
  href: string;
  color: string;
  bg: string;
};

function buildContactLinks(c: ContactContent): ContactLink[] {
  const out: ContactLink[] = [];
  if (c.whatsapp.visible) {
    out.push({
      icon: MessageCircle,
      label: "WhatsApp",
      value: c.whatsapp.label,
      href: c.whatsapp.url,
      color: "#25D366",
      bg: "#ECFDF5",
    });
  }
  if (c.instagram.visible) {
    out.push({
      icon: Instagram,
      label: "Instagram",
      value: c.instagram.handle,
      href: c.instagram.url,
      color: "#E1306C",
      bg: "#FFF0F5",
    });
  }
  if (c.email.visible) {
    out.push({
      icon: Mail,
      label: "Email",
      value: c.email.address,
      href: `mailto:${c.email.address}`,
      color: "#87102C",
      bg: "#FFF4F6",
    });
  }
  if (c.youtube.visible && c.youtube.url) {
    out.push({
      icon: Youtube,
      label: "YouTube",
      value: "Watch our channel",
      href: c.youtube.url,
      color: "#FF0000",
      bg: "#FFF0F0",
    });
  }
  if (c.facebook.visible && c.facebook.url) {
    out.push({
      icon: Facebook,
      label: "Facebook",
      value: "Find us on Facebook",
      href: c.facebook.url,
      color: "#1877F2",
      bg: "#EFF6FF",
    });
  }
  if (c.twitter.visible && c.twitter.url) {
    out.push({
      icon: Twitter,
      label: "Twitter / X",
      value: "Follow our updates",
      href: c.twitter.url,
      color: "#0F1419",
      bg: "#F4F4F5",
    });
  }
  if (c.tiktok?.visible && c.tiktok.url) {
    out.push({
      icon: TikTokIcon,
      label: "TikTok",
      value: "@everlasting_hills_church",
      href: c.tiktok.url,
      color: "#010101",
      bg: "#F4F4F5",
    });
  }
  return out;
}

export default function ContactSection({ content }: { content?: ContactContent }) {
  const c = content ?? CONTACT_FALLBACK;
  const contactLinks = buildContactLinks(c);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post("/forms/contact", formState);
      setSubmitted(true);
      setFormState({ name: "", email: "", message: "" });
    } catch (err) {
      const msg = (err as { message?: string }).message;
      setError(msg ?? "Could not send your message. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <GetInTouch />

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: Contact links */}
          <div>
            <ScrollReveal delay={0.1}>
              <p className="text-[#111] font-semibold text-lg leading-none mb-6">
                Reach us directly
              </p>
            </ScrollReveal>
            <div className="space-y-4">
              {contactLinks.map((link, i) => (
                <ScrollReveal key={link.label} delay={0.15 + i * 0.08}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-5 rounded-2xl border border-[#E7CDD3]/60 bg-[#FFF4F6]/50 hover:bg-[#FFF4F6] hover:border-[#E7CDD3] hover:shadow-[0_4px_20px_rgba(135,16,44,0.06)] transition-all duration-300 group"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: link.bg, color: link.color }}
                    >
                      <link.icon size={18} />
                    </div>
                    <div>
                      <p className="text-[#999] text-xs tracking-[0.12em] uppercase font-medium">
                        {link.label}
                      </p>
                      <p className="text-[#111] font-medium text-sm group-hover:text-[#87102C] transition-colors">
                        {link.value}
                      </p>
                    </div>
                  </a>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Right: Contact form */}
          <ScrollReveal delay={0.2} direction="right" className="pt-[3px]">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center rounded-2xl border border-dashed border-[#E7CDD3] p-12">
                <div className="w-14 h-14 rounded-full bg-[#FFE8ED] flex items-center justify-center mb-5">
                  <Send size={22} className="text-[#87102C]" />
                </div>
                <h3 className="text-[#111] font-bold text-xl mb-2">
                  Message received!
                </h3>
                <p className="text-[#666] text-sm leading-relaxed">
                  Thank you for reaching out. We will get back to you as soon as
                  possible.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-[#87102C] text-sm font-semibold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-[#444] text-sm font-medium mb-2"
                  >
                    Your Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Tunde Adeyemi"
                    value={formState.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 rounded-xl border border-[#E7CDD3] bg-[#FFF4F6]/50 text-[#111] placeholder:text-[#bbb] text-sm focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C] transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[#444] text-sm font-medium mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={formState.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 rounded-xl border border-[#E7CDD3] bg-[#FFF4F6]/50 text-[#111] placeholder:text-[#bbb] text-sm focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C] transition-all"
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-[#444] text-sm font-medium mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    placeholder="How can we help, or what would you like to share?"
                    value={formState.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 rounded-xl border border-[#E7CDD3] bg-[#FFF4F6]/50 text-[#111] placeholder:text-[#bbb] text-sm focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C] transition-all resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-full bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-all duration-200 hover:shadow-lg hover:shadow-burgundy/25 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  <Send size={15} className={isLoading ? "animate-pulse" : ""} />
                  {isLoading ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
