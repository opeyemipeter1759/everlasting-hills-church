"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Loader2, MessageCircleQuestion, Send, X } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { normalizeRole } from "@/lib/auth/frontend-session";
import { showToast } from "@/components/ui/toast/toast";
import { userMessageForError } from "@/lib/api/user-message";
import { askHillsBot } from "@/lib/api/help-chat";
import { findSection, matchTopic } from "@/lib/help/help-content";

interface Answer {
  steps: string[];
  cta?: { label: string; href: string };
}

type Message =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "loading" }
  | { id: string; kind: "answer"; answer: Answer; feedback?: "yes" | "no" }
  | { id: string; kind: "fallback" };

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random());
}

export default function HelpChatWidget() {
  const pathname = usePathname() ?? "";
  const user = useCurrentUser();
  const role = normalizeRole(user?.role);
  const section = findSection(pathname);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [contactOpen, setContactOpen] = useState(false);
  const [contactText, setContactText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, contactOpen]);

  // Only on dashboard pages — this isn't rendered on the public site anyway
  // since the widget is mounted in app/dashboard/layout.tsx, but guard in
  // case that ever changes.
  if (!pathname.startsWith("/dashboard")) return null;

  async function ask(question: string) {
    const loadingId = newId();
    setMessages((prev) => [...prev, { id: newId(), kind: "user", text: question }, { id: loadingId, kind: "loading" }]);

    try {
      const result = await askHillsBot(question, { pathname, role: role ?? "MEMBER" });
      const answer: Message =
        result.confident && result.steps.length > 0
          ? {
              id: loadingId,
              kind: "answer",
              answer: { steps: result.steps, cta: result.ctaLabel && result.ctaHref ? { label: result.ctaLabel, href: result.ctaHref } : undefined },
            }
          : { id: loadingId, kind: "fallback" };
      setMessages((prev) => prev.map((m) => (m.id === loadingId ? answer : m)));
    } catch {
      // HillsBot unreachable or not configured — fall back to the local,
      // member-pages-only knowledge base rather than leaving the question hanging.
      const topic = matchTopic(question, section);
      const answer: Message = topic
        ? { id: loadingId, kind: "answer", answer: { steps: topic.steps, cta: topic.cta } }
        : { id: loadingId, kind: "fallback" };
      setMessages((prev) => prev.map((m) => (m.id === loadingId ? answer : m)));
    }
  }

  function handleSend() {
    const q = input.trim();
    if (!q) return;
    setInput("");
    void ask(q);
  }

  function openContact(prefill?: string) {
    setContactText((current) => current || prefill || "");
    setContactOpen(true);
    setSent(false);
  }

  function setFeedback(id: string, feedback: "yes" | "no") {
    setMessages((prev) => prev.map((m) => (m.id === id && m.kind === "answer" ? { ...m, feedback } : m)));
    if (feedback === "no") openContact();
  }

  async function submitContact() {
    const question = contactText.trim();
    if (!question) return showToast.error("Type your question first");
    setSending(true);
    try {
      await apiClient.post("/forms/question", {
        question,
        name: user?.fullName || undefined,
        email: user?.email || undefined,
        is_anonymous: "false",
      });
      setSent(true);
      setContactText("");
    } catch (err) {
      showToast.error(userMessageForError(err, "Couldn't send your question"));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#150D10] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[560px] sm:max-h-[calc(100vh-3rem)] sm:w-[380px] sm:rounded-2xl sm:border sm:border-white/10 sm:shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 bg-[#87102C] px-4 pb-3.5 pt-[max(0.875rem,env(safe-area-inset-top))]">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <MessageCircleQuestion size={18} className="text-white" aria-hidden="true" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="flex items-center gap-1.5 text-[15px] font-bold text-white">
                  HillsBot
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Online
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-white/70">Here to help with anything on the site</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close HillsBot"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <p className="text-sm text-white/70">
                Hi{user?.fullName ? ` ${user.fullName.split(" ")[0]}` : ""}! How can I help you today?
              </p>
            )}

            {messages.map((m) => {
              if (m.kind === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#87102C] px-3.5 py-2 text-sm text-white">{m.text}</p>
                  </div>
                );
              }
              if (m.kind === "loading") {
                return (
                  <div
                    key={m.id}
                    role="status"
                    aria-label="HillsBot is typing"
                    className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-4 py-3.5"
                  >
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#e8768a]/70 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#e8768a]/70 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#e8768a]/70" />
                  </div>
                );
              }
              if (m.kind === "fallback") {
                return (
                  <div key={m.id} className="max-w-[90%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-white/80">
                    I don&apos;t have an answer for that yet. Try rephrasing, or talk to a person below — someone will get back to you.
                  </div>
                );
              }
              return (
                <div key={m.id} className="max-w-[90%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-3.5 py-3">
                  <p className="text-sm font-semibold text-white">Here&apos;s how it works:</p>
                  <ol className="mt-2 space-y-1.5">
                    {m.answer.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#e8768a]/15 text-[10px] font-bold text-[#e8768a]">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  {m.answer.cta && (
                    <a
                      href={m.answer.cta.href}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#87102C] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#9c1636]"
                    >
                      {m.answer.cta.label}
                      <ArrowRight size={12} aria-hidden="true" />
                    </a>
                  )}
                  <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2.5">
                    {m.feedback ? (
                      <p className="text-xs text-white/50">
                        {m.feedback === "yes" ? "Glad that helped!" : "Thanks — let's get you to a person."}
                      </p>
                    ) : (
                      <>
                        <span className="text-xs text-white/50">Did this help?</span>
                        <button
                          type="button"
                          onClick={() => setFeedback(m.id, "yes")}
                          className="rounded-full border border-white/15 px-2.5 py-1 text-xs font-semibold text-white/80 hover:border-emerald-400/40 hover:text-emerald-300"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedback(m.id, "no")}
                          className="rounded-full border border-white/15 px-2.5 py-1 text-xs font-semibold text-white/80 hover:border-rose-400/40 hover:text-rose-300"
                        >
                          Not really
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {contactOpen && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                {sent ? (
                  <p className="text-sm text-white/80">
                    Thanks — your question has been sent to the church team. We&apos;ll get back to you soon.
                  </p>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-white/60">Talk to a person</p>
                    <textarea
                      value={contactText}
                      onChange={(e) => setContactText(e.target.value)}
                      rows={3}
                      placeholder="What do you need help with?"
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#e8768a]/50"
                    />
                    <button
                      type="button"
                      onClick={submitContact}
                      disabled={sending}
                      className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#87102C] px-3.5 text-xs font-semibold text-white hover:bg-[#9c1636] disabled:opacity-60"
                    >
                      {sending && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
                      Send to the church team
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Type your question..."
                className="min-h-11 flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#e8768a]/50"
              />
              <button
                type="button"
                onClick={handleSend}
                aria-label="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#87102C] text-white hover:bg-[#9c1636]"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[11px] text-white/35">Never share passwords here.</p>
              <button
                type="button"
                onClick={() => openContact()}
                className="shrink-0 text-xs font-semibold text-[#e8768a] hover:underline"
              >
                Talk to a person
              </button>
            </div>
          </div>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open HillsBot"
          className="fixed bottom-5 right-4 z-50 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#87102C] px-4 text-sm font-semibold text-white shadow-lg hover:bg-[#9c1636] sm:right-6"
        >
          <MessageCircleQuestion size={18} aria-hidden="true" />
          Ask HillsBot
        </button>
      )}
    </>
  );
}
