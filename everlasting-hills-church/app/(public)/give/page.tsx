"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Search, Building2, Info } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";
import GiveHero from "@/components/give/GiveHero";

// ── Account data (Globus Bank) ──────────────────────────────────────────────

const ACCOUNT_NAME = "EVERLASTING HEIGHTS MINISTRIES";
// Drop the Globus Bank logo (transparent PNG) at this path; cards fall back to
// an icon box until the file exists.
const GLOBUS_LOGO = "/images/globus-bank.png";

interface Account {
  id: string;
  bank: string;
  purpose: string;
  number: string;
  currency: string;
  name: string;
  logo?: string;
}

const LOCAL_ACCOUNTS: Account[] = [
  { id: "prim-1", bank: "Globus Bank", purpose: "Tithe & Offering", number: "2007044595", currency: "NGN", name: ACCOUNT_NAME, logo: GLOBUS_LOGO },
  { id: "prim-2", bank: "Globus Bank", purpose: "Rent", number: "2007060182", currency: "NGN", name: ACCOUNT_NAME, logo: GLOBUS_LOGO },
  { id: "prim-3", bank: "Globus Bank", purpose: "Building / Project", number: "2007060223", currency: "NGN", name: ACCOUNT_NAME, logo: GLOBUS_LOGO },
];

const DOM_ACCOUNTS: Account[] = [
  { id: "dom-1", bank: "Globus Bank", purpose: "USD Domiciliary", number: "1000596249", currency: "USD", name: ACCOUNT_NAME, logo: GLOBUS_LOGO },
  { id: "dom-2", bank: "Globus Bank", purpose: "GBP Domiciliary", number: "1000596311", currency: "GBP", name: ACCOUNT_NAME, logo: GLOBUS_LOGO },
];

const TABS = [
  { key: "local" as const, label: "Local (Naira)" },
  { key: "dom" as const, label: "Domiciliary" },
];

export default function GivePage() {
  const [tab, setTab] = useState<"local" | "dom">("local");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const accounts = tab === "local" ? LOCAL_ACCOUNTS : DOM_ACCOUNTS;
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
      {/* ── Hero (full-bleed image) ── */}
      <GiveHero />

      {/* ── Ways to give (light) ── */}
      <section id="ways-to-give" className="scroll-mt-20 bg-white py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <ScrollReveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#87102C]">
              Ways to Give
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-tight text-[#111] sm:text-4xl">
              Give by <span className="text-[#87102C]">bank transfer</span>
            </h2>
          </ScrollReveal>
          {/* <ScrollReveal delay={0.2}>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#555] sm:text-lg">
              100% of your gift goes directly to the ministry, with no payment
              gateway fees. Tap any account below to copy the number.
            </p>
          </ScrollReveal> */}

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
                      delay={i * 0.08}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Reassurance line (single, quiet) */}
          {/* <ScrollReveal delay={0.2}>
            <p className="mt-12 text-center text-sm text-[#8a7e80]">
              All gifts go to{" "}
              <span className="font-semibold text-[#111]">{ACCOUNT_NAME}</span>. For
              giving statements or help, reach out via the{" "}
              <a href="/contact" className="font-semibold text-[#87102C] hover:underline">
                contact page
              </a>
              .
            </p>
          </ScrollReveal> */}
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
    </main>
  );
}

// ── Elevated card + anchor-info-chip pattern ────────────────────────────────

function AccountCard({
  acc,
  copied,
  onCopy,
  delay,
}: {
  acc: Account;
  copied: boolean;
  onCopy: () => void;
  delay: number;
}) {
  const [logoErr, setLogoErr] = useState(false);
  const showLogo = Boolean(acc.logo) && !logoErr;

  return (
    <ScrollReveal delay={delay}>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copy ${acc.purpose} account number ${acc.number}`}
        className="group h-full w-full rounded-2xl border border-[#E7CDD3]/60 bg-white p-6 text-left shadow-[0_1px_3px_rgba(135,16,44,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#E7CDD3] hover:shadow-[0_8px_40px_rgba(135,16,44,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40"
      >
        {/* Icon chip + currency */}
        <div className="mb-5 flex items-start justify-between">
          {showLogo ? (
            <span className="inline-flex h-11 items-center rounded-xl border border-[#E7CDD3]/70 bg-white px-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={acc.logo}
                alt={acc.bank}
                onError={() => setLogoErr(true)}
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
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a7e80]">
          {acc.bank} · {acc.purpose}
        </p>
        <p className="font-mono text-2xl font-bold tracking-tight text-[#111]">
          {acc.number}
        </p>
        <p className="mt-1.5 truncate text-sm text-[#555]">{acc.name}</p>

        {/* Copy affordance */}
        <span className="mt-5 flex items-center gap-1.5 border-t border-[#E7CDD3]/50 pt-4 text-xs font-bold uppercase tracking-wider text-[#87102C]">
          {copied ? (
            <>
              <Check size={14} /> Copied to clipboard
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
        </span>
      </button>
    </ScrollReveal>
  );
}
