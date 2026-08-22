"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Search, Building2, Info, X, Landmark } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";
import GiveHero from "@/components/give/GiveHero";

// ── Content shape (seeded from CMS `give` structured content) ────────────────

export interface WireField {
  label: string;
  value: string;
}

export interface WireSection {
  title: string;
  fields: WireField[];
}

export interface GiveAccount {
  bank: string;
  purpose: string;
  number: string;
  currency: string;
  /** International wire-routing chain (intermediary/correspondent/beneficiary bank) for domiciliary accounts. */
  wire?: WireSection[];
}

export interface GiveContent {
  eyebrow: string;
  titleTop: string;
  accentTop: string;
  titleBottom: string;
  accentBottom: string;
  subtitle: string;
  heroImage: string | null;
  sectionLabel: string;
  headingLead: string;
  headingAccent: string;
  accountName: string;
  local: GiveAccount[];
  domiciliary: GiveAccount[];
}

// Drop the Globus Bank logo (transparent PNG) at this path; cards fall back to
// an icon box until the file exists.
const GLOBUS_LOGO = "/images/globus-bank.png";

interface Account extends GiveAccount {
  id: string;
  name: string;
  logo?: string;
}

const TABS = [
  { key: "local" as const, label: "Local (Naira)" },
  { key: "dom" as const, label: "Domiciliary" },
];

export default function GiveClient({
  content,
  preview,
}: {
  content: GiveContent;
  preview?: boolean;
}) {
  const [tab, setTab] = useState<"local" | "dom">("local");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [wireAccount, setWireAccount] = useState<Account | null>(null);

  const localAccounts = useMemo<Account[]>(
    () =>
      content.local.map((a, i) => ({
        ...a,
        id: `local-${i}`,
        name: content.accountName,
        logo: GLOBUS_LOGO,
      })),
    [content.local, content.accountName],
  );
  const domAccounts = useMemo<Account[]>(
    () =>
      content.domiciliary.map((a, i) => ({
        ...a,
        id: `dom-${i}`,
        name: content.accountName,
        logo: GLOBUS_LOGO,
      })),
    [content.domiciliary, content.accountName],
  );

  const accounts = tab === "local" ? localAccounts : domAccounts;
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.bank.toLowerCase().includes(q) ||
        a.purpose.toLowerCase().includes(q) ||
        a.number.includes(q),
    );
  }, [accounts, query]);

  function handleCopy(acc: Account) {
    navigator.clipboard?.writeText(acc.number);
    setCopiedId(acc.id);
    setToast(`${acc.purpose} · ${acc.number}`);
    window.setTimeout(() => setCopiedId(null), 2000);
    window.setTimeout(() => setToast(null), 3000);
  }

  return (
    <main className="bg-white">
      {preview && (
        <div className="bg-[#87102C] text-white text-center text-xs font-semibold py-2 tracking-wide">
          PREVIEW — draft, not published
        </div>
      )}

      {/* ── Hero (full-bleed image) ── */}
      <GiveHero
        eyebrow={content.eyebrow}
        titleTop={content.titleTop}
        accentTop={content.accentTop}
        titleBottom={content.titleBottom}
        accentBottom={content.accentBottom}
        subtitle={content.subtitle}
        backgroundImage={content.heroImage}
      />

      {/* ── Ways to give (light) ── */}
      <section id="ways-to-give" className="scroll-mt-20 bg-white py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <ScrollReveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#87102C]">
              {content.sectionLabel}
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-tight text-[#111] sm:text-4xl">
              {content.headingLead}{" "}
              <span className="text-[#87102C]">{content.headingAccent}</span>
            </h2>
          </ScrollReveal>

          {/* Controls: tabs + search */}
          <ScrollReveal delay={0.3}>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex rounded-full border border-[#E7CDD3] bg-[#FFF4F6] p-1 self-start">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setTab(t.key);
                      setQuery("");
                    }}
                    className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                      tab === t.key
                        ? "bg-[#87102C] text-white shadow-sm"
                        : "text-[#8a7e80] hover:text-[#87102C]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b8a8ac]"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search account or purpose…"
                  className="w-full rounded-full border border-[#E7CDD3] bg-white py-3 pl-11 pr-4 text-sm text-[#111] placeholder:text-[#b8a8ac] transition-all focus-visible:border-[#87102C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/15"
                />
              </div>
            </div>
          </ScrollReveal>

          {/* Cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {filtered.length === 0 ? (
                <div className="mt-10 rounded-2xl border border-dashed border-[#E7CDD3] bg-[#FFF4F6]/50 py-16 text-center">
                  <Info className="mx-auto mb-3 text-[#87102C]/40" size={28} />
                  <p className="font-medium text-[#8a7e80]">
                    No account matches “{query}”.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="mt-3 text-xs font-bold uppercase tracking-wider text-[#87102C] hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((acc, i) => (
                    <AccountCard
                      key={acc.id}
                      acc={acc}
                      copied={copiedId === acc.id}
                      onCopy={() => handleCopy(acc)}
                      onShowWire={() => setWireAccount(acc)}
                      delay={i * 0.08}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Copy toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[#E7CDD3] bg-white px-5 py-3 shadow-[0_8px_40px_rgba(135,16,44,0.12)]"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-[#111]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#87102C] text-white">
                <Check size={13} />
              </span>
              Copied · {toast}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wire instructions modal */}
      <AnimatePresence>
        {wireAccount?.wire && (
          <WireModal acc={wireAccount} onClose={() => setWireAccount(null)} />
        )}
      </AnimatePresence>
    </main>
  );
}

// ── International wire-routing modal ────────────────────────────────────────

function WireModal({ acc, onClose }: { acc: Account; onClose: () => void }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function handleFieldCopy(key: string, value: string) {
    if (value.toLowerCase() === "to be provided") return;
    navigator.clipboard?.writeText(value);
    setCopiedField(key);
    window.setTimeout(() => setCopiedField((c) => (c === key ? null : c)), 1500);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(135,16,44,0.25)]"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[#E7CDD3]/70 bg-white px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#87102C]">
              {acc.currency} Wire Instructions
            </p>
            <p className="mt-0.5 text-sm text-[#8a7e80]">For transfers sent from abroad</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close wire instructions"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#8a7e80] transition-colors hover:bg-[#FFF4F6] hover:text-[#87102C]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {acc.wire!.map((section, si) => (
            <div key={section.title} className={si === 0 ? "" : "mt-5"}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a7e80]">
                {section.title}
              </p>
              <div className="overflow-hidden rounded-xl border border-[#E7CDD3]/70">
                {section.fields.map((f, fi) => {
                  const key = `${si}-${fi}`;
                  const placeholder = f.value.toLowerCase() === "to be provided";
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleFieldCopy(key, f.value)}
                      disabled={placeholder}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                        fi !== 0 ? "border-t border-[#E7CDD3]/50" : ""
                      } ${placeholder ? "cursor-default" : "hover:bg-[#FFF4F6]"}`}
                    >
                      <span className="text-xs text-[#8a7e80]">{f.label}</span>
                      <span
                        className={`flex items-center gap-2 text-right text-sm font-semibold ${
                          placeholder ? "italic text-[#b8a8ac]" : "text-[#111]"
                        }`}
                      >
                        {f.value}
                        {!placeholder &&
                          (copiedField === key ? (
                            <Check size={13} className="shrink-0 text-[#87102C]" />
                          ) : (
                            <Copy size={13} className="shrink-0 text-[#b8a8ac]" />
                          ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Elevated card + anchor-info-chip pattern ────────────────────────────────

function AccountCard({
  acc,
  copied,
  onCopy,
  onShowWire,
  delay,
}: {
  acc: Account;
  copied: boolean;
  onCopy: () => void;
  onShowWire: () => void;
  delay: number;
}) {
  const [logoErr, setLogoErr] = useState(false);
  const showLogo = Boolean(acc.logo) && !logoErr;
  const hasNumber = acc.number.toLowerCase() !== "to be provided";
  // Wire instructions are only meaningful once the account itself is set up —
  // don't offer routing details for an account that's still "To be provided".
  const hasWire = hasNumber && Boolean(acc.wire && acc.wire.length > 0);

  return (
    <ScrollReveal delay={delay}>
      <div className="group h-full w-full rounded-2xl border border-[#E7CDD3]/60 bg-white p-6 text-left shadow-[0_1px_3px_rgba(135,16,44,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#E7CDD3] hover:shadow-[0_8px_40px_rgba(135,16,44,0.1)]">
        {/* Icon chip + currency */}
        <div className="mb-5 flex items-start justify-between">
          {showLogo ? (
            <span className="inline-flex h-11 items-center rounded-xl border border-[#E7CDD3]/70 bg-white px-3">
              <Image
                src={acc.logo!}
                alt={acc.bank}
                onError={() => setLogoErr(true)}
                width={96}
                height={24}
                className="h-6 w-auto object-contain"
              />
            </span>
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFE8ED] text-[#87102C]">
              <Building2 size={20} />
            </span>
          )}
          <span className="rounded-full bg-[#FFF4F6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#87102C]">
            {acc.currency}
          </span>
        </div>

        {/* Anchor info chip: label → value */}
        <button
          type="button"
          onClick={onCopy}
          disabled={!hasNumber}
          aria-label={hasNumber ? `Copy ${acc.purpose} account number ${acc.number}` : undefined}
          className={`w-full text-left ${hasNumber ? "" : "cursor-default"}`}
        >
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a7e80]">
            {acc.bank} · {acc.purpose}
          </p>
          <p
            className={`font-mono text-2xl font-bold tracking-tight ${
              hasNumber ? "text-[#111]" : "italic text-[#b8a8ac]"
            }`}
          >
            {acc.number}
          </p>
          <p className="mt-1.5 truncate text-sm text-[#555]">{acc.name}</p>
        </button>

        {/* Footer affordances */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#E7CDD3]/50 pt-4">
          {hasNumber ? (
            <button
              type="button"
              onClick={onCopy}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#87102C]"
            >
              {copied ? (
                <>
                  <Check size={14} /> Copied
                </>
              ) : (
                <>
                  <Copy
                    size={14}
                    className="transition-transform group-hover:-translate-y-0.5"
                  />
                  Tap to copy
                </>
              )}
            </button>
          ) : (
            <span className="text-xs font-semibold text-[#b8a8ac]">Account pending</span>
          )}

          {hasWire && (
            <button
              type="button"
              onClick={onShowWire}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#87102C] hover:underline"
            >
              <Landmark size={14} />
              Wire Instructions
            </button>
          )}
        </div>
      </div>
    </ScrollReveal>
  );
}
