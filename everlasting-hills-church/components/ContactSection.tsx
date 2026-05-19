"use client";

import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import GetInTouch from "./GetInTouch";
import { Mail, MessageCircle, Instagram, Send } from "lucide-react";

// ── Update all contact info here ──
const contactLinks = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "Chat with us on WhatsApp", // ← Update to your number
    // ── Replace with your WhatsApp link: https://wa.me/234XXXXXXXXXX ──
    href: "#",
    color: "#25D366",
    bg: "#ECFDF5",
  },
  {
    icon: Instagram,
    label: "Instagram",
    value: "@everlastinghillschurch", // ← Update to your handle
    // ── Replace with your Instagram URL ──
    href: "#",
    color: "#E1306C",
    bg: "#FFF0F5",
  },
  {
    icon: Mail,
    label: "Email",
    value: "hello@everlastinghills.org", // ← Update to your email
    href: "mailto:hello@everlastinghills.org",
    color: "#87102C",
    bg: "#FFF4F6",
  },
];

export default function ContactSection() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Replace this with your actual form submission logic (e.g. Formspree, Resend, etc.) ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formState);
    setSubmitted(true);
    setFormState({ name: "", email: "", message: "" });
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
              <p className="text-[#111] font-semibold text-lg mb-6">
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
                      style={{ background: link.bg }}
                    >
                      <link.icon size={18} style={{ color: link.color }} />
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
          <ScrollReveal delay={0.2} direction="right">
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

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-full bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-all duration-200 hover:shadow-lg hover:shadow-burgundy/25 hover:-translate-y-0.5"
                >
                  <Send size={15} />
                  Send Message
                </button>
              </form>
            )}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
