"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Loader2, MessageCircleQuestion, Send, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { normalizeRole } from "@/lib/auth/frontend-session";
import { showToast } from "@/components/ui/toast/toast";
import { userMessageForError } from "@/lib/api/user-message";
import { askHillsBot } from "@/lib/api/help-chat";
import { findSection, matchTopic } from "@/lib/help/help-content";

const ROLE_LABELS: Record<string, string> = {
  MEMBER: "Member",
  UNIT_LEAD: "Unit Lead",
  HEAD_USHER: "Head Usher",
  FINANCE_HEAD: "Finance Head",
  HOD: "Unit Head",
  ADMIN_HEAD: "Admin Head",
  ADMIN: "Admin",
  PASTOR: "Pastor",
  SUPER_ADMIN: "Super Admin",
};

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
      const result = await askHillsBot(question, { pathname, role: role ? (ROLE_LABELS[role] ?? "Member") : "Member" });
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
        <div className="fixed inset-x-3 bottom-24 z-50 flex max-h-[min(640px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-2xl border border-[#E4D6C7] bg-white shadow-2xl dark:border-white/10 dark:bg-[#1A1210] sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[400px]">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 bg-[#87102C] px-4 py-3.5 text-white">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-bold">
                <MessageCircleQuestion size={16} aria-hidden="true" />
                HillsBot
              </p>
              <p className="mt-0.5 text-xs text-white/75">Here to help with anything on the site</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close HillsBot"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <p className="text-sm text-gray-600 dark:text-white/70">
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
                    className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm border border-[#E4D6C7] bg-white px-4 py-3.5 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#87102C]/50 [animation-delay:-0.3s] dark:bg-[#e8768a]/60" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#87102C]/50 [animation-delay:-0.15s] dark:bg-[#e8768a]/60" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#87102C]/50 dark:bg-[#e8768a]/60" />
                  </div>
                );
              }
              if (m.kind === "fallback") {
                return (
                  <div key={m.id} className="max-w-[90%] rounded-2xl rounded-bl-sm border border-[#E4D6C7] bg-white px-3.5 py-3 text-sm text-gray-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/80">
                    I don&apos;t have an answer for that yet. Try rephrasing, or talk to a person below — someone will get back to you.
                  </div>
                );
              }
              return (
                <div key={m.id} className="max-w-[90%] rounded-2xl rounded-bl-sm border border-[#E4D6C7] bg-white px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Here&apos;s how it works:</p>
                  <ol className="mt-2 space-y-1.5">
                    {m.answer.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-white/80">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#87102C]/10 text-[10px] font-bold text-[#87102C] dark:bg-[#e8768a]/15 dark:text-[#e8768a]">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  {m.answer.cta && (
                    <a
                      href={m.answer.cta.href}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#87102C] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6f0d24]"
                    >
                      {m.answer.cta.label}
                      <ArrowRight size={12} aria-hidden="true" />
                    </a>
                  )}
                  <div className="mt-3 flex items-center gap-2 border-t border-[#E4D6C7] pt-2.5 dark:border-white/10">
                    {m.feedback ? (
                      <p className="text-xs text-gray-500 dark:text-white/50">
                        {m.feedback === "yes" ? "Glad that helped!" : "Thanks — let's get you to a person."}
                      </p>
                    ) : (
                      <>
                        <span className="text-xs text-gray-500 dark:text-white/50">Did this help?</span>
                        <button
                          type="button"
                          onClick={() => setFeedback(m.id, "yes")}
                          aria-label="Yes, this helped"
                          className="rounded-lg p-1 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
                        >
                          <ThumbsUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedback(m.id, "no")}
                          aria-label="Not really"
                          className="rounded-lg p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                        >
                          <ThumbsDown size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {contactOpen && (
              <div className="rounded-2xl border border-[#E4D6C7] bg-[#FBF6EF] p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                {sent ? (
                  <p className="text-sm text-gray-700 dark:text-white/80">
                    Thanks — your question has been sent to the church team. We&apos;ll get back to you soon.
                  </p>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-gray-600 dark:text-white/60">Talk to a person</p>
                    <textarea
                      value={contactText}
                      onChange={(e) => setContactText(e.target.value)}
                      rows={3}
                      placeholder="What do you need help with?"
                      className="mt-1.5 w-full rounded-xl border border-[#E4D6C7] bg-white px-3 py-2 text-sm outline-none focus:border-[#87102C] dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={submitContact}
                      disabled={sending}
                      className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#87102C] px-3.5 text-xs font-semibold text-white hover:bg-[#6f0d24] disabled:opacity-60"
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
          <div className="border-t border-[#E4D6C7] p-3 dark:border-white/10">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Type your question..."
                className="min-h-10 flex-1 rounded-xl border border-[#E4D6C7] bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSend}
                aria-label="Send"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#87102C] text-white hover:bg-[#6f0d24]"
              >
                <Send size={15} />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[11px] text-gray-400 dark:text-white/35">Never share passwords or personal details here.</p>
              <button
                type="button"
                onClick={() => openContact()}
                className="shrink-0 text-xs font-semibold text-[#87102C] hover:underline dark:text-[#e8768a]"
              >
                Talk to a person
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close HillsBot" : "Open HillsBot"}
        className={
          open
            ? "fixed bottom-5 right-4 z-50 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#87102C] px-4 text-sm font-semibold text-white shadow-lg hover:bg-[#6f0d24] sm:right-6"
            : "fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#87102C] text-white shadow-lg hover:bg-[#6f0d24] sm:right-6"
        }
      >
        {open ? (
          <>
            <X size={14} aria-hidden="true" />
            Close
          </>
        ) : (
          <MessageCircleQuestion size={22} aria-hidden="true" />
        )}
      </button>
    </>
  );
}
