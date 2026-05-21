"use client";

import { useState } from "react";
import { Copy, Check, CreditCard, QrCode } from "lucide-react";
import BankLogo from "./BankLogo";
import QRCodeModal from "./QRCodeModal";

type Account = {
  id: string;
  bank: string;
  label: string;
  number: string;
  currency?: string;
};

const LOCAL_ACCOUNTS: Account[] = [
  { id: "a1", bank: "Fidelity", label: "Offering / Tithe", number: "12345678", currency: "NGN" },
  { id: "a2", bank: "Fidelity", label: "Building", number: "12345678", currency: "NGN" },
  { id: "a3", bank: "Fidelity", label: "Rent", number: "12345678", currency: "NGN" },
  { id: "a4", bank: "Fidelity", label: "Global", number: "12345678", currency: "NGN" },
];

const OTHER_ACCOUNTS: Account[] = [
  { id: "o1", bank: "Access Bank", label: "Building account", number: "12345678", currency: "NGN" },
  { id: "o2", bank: "Access Bank", label: "Seed church", number: "12345678", currency: "NGN" },
  { id: "o3", bank: "Stanbic IBTC", label: "Building account", number: "12345678", currency: "NGN" },
  { id: "o4", bank: "Moniepoint", label: "Microfinance Bank", number: "12345678", currency: "NGN" },
];

const DOMICILIARY: Account[] = [
  { id: "d1", bank: "Fidelity", label: "Domiciliary (USD)", number: "12345678", currency: "USD" },
];

export default function GivingAccounts() {
  const [tab, setTab] = useState<"local" | "dom">("local");
  const [copied, setCopied] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrText, setQrText] = useState<string | null>(null);
  const [qrTitle, setQrTitle] = useState<string | undefined>(undefined);
  const [donateOpen, setDonateOpen] = useState(false);

  const copy = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      setCopiedValue(value);
      setTimeout(() => {
        setCopied(null);
        setCopiedValue(null);
      }, 1800);
    } catch (e) {
      // ignore
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 relative">
      {/* Toast */}
      {copiedValue && (
        <div className="fixed right-6 top-6 z-50">
          <div className="flex items-center gap-3 bg-white/95 text-church-dark px-4 py-2 rounded-lg shadow">
            <Check size={16} />
            <div className="text-sm">Copied {copiedValue}</div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 text-xs uppercase tracking-wide text-white/70">Give — Accounts</div>
          <h2 className="mt-3 text-2xl font-bold">All account numbers</h2>
          <p className="mt-1 text-white/60">Select an account to copy its number. Use the Domiciliary tab for foreign-currency transfers.</p>
        </div>
        <div className="flex gap-3">
          <div role="tablist" aria-label="Account types" className="inline-flex gap-2">
            <button onClick={() => setTab("local")} aria-pressed={tab === "local"} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${tab === "local" ? "bg-church-maroon text-white" : "bg-white/5 text-white/70"}`}>Local</button>
            <button onClick={() => setTab("dom")} aria-pressed={tab === "dom"} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${tab === "dom" ? "bg-church-maroon text-white" : "bg-white/5 text-white/70"}`}>Domiciliary</button>
          </div>

          <div className="relative">
            <button onClick={() => setDonateOpen((s) => !s)} aria-expanded={donateOpen} aria-controls="donate-panel" className="px-4 py-2 rounded-full text-sm font-semibold bg-church-accent text-white inline-flex items-center gap-2">
              <CreditCard size={14} /> Give Online
            </button>
            {donateOpen && (
              <div id="donate-panel" role="dialog" aria-label="Online giving options" className="absolute right-0 mt-2 w-56 bg-white/5 border border-white/6 rounded-xl p-3 shadow">
                <a href="#" onClick={(e) => e.preventDefault()} className="block px-3 py-2 rounded hover:bg-white/6">Stripe (placeholder)</a>
                <a href="#" onClick={(e) => e.preventDefault()} className="block px-3 py-2 rounded hover:bg-white/6">PayPal (placeholder)</a>
                <a href="mailto:give@example.com" className="block px-3 py-2 rounded hover:bg-white/6">Contact to Give</a>
                <div className="text-right mt-2">
                  <button onClick={() => setDonateOpen(false)} className="text-sm px-3 py-1 rounded bg-white/5">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {tab === "local" ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <section>
            <h3 className="text-white font-semibold mb-4">Primary Accounts</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {LOCAL_ACCOUNTS.map((a) => (
                <article key={a.id} className="group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-b from-white/5 to-white/3 border border-white/6 hover:shadow-lg transition-transform transform hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <BankLogo bank={a.bank} currency={a.currency} />
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-[0.18em]">{a.bank}</p>
                        <p className="text-white font-semibold text-lg mt-2">{a.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-white/50 text-sm">{a.currency}</div>
                      <button onClick={() => { copy(a.number, a.id); }} aria-label={`Copy ${a.number}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-church-accent/10 text-church-accent font-semibold">
                        {copied === a.id ? <Check size={14} /> : <Copy size={14} />} <span className="hidden sm:inline">Copy</span>
                      </button>
                      <button onClick={() => { setQrText(`${a.bank} — ${a.label}\nAccount: ${a.number}\nCurrency: ${a.currency}`); setQrTitle(`${a.bank} — ${a.label}`); setQrOpen(true); }} aria-label={`Show QR for ${a.number}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 text-white/90">
                        <QrCode size={14} /> <span className="hidden sm:inline">QR</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-white font-extrabold text-2xl tracking-tight">{a.number}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-4">Other Accounts</h3>
            <div className="space-y-3">
              {OTHER_ACCOUNTS.map((a) => (
                <article key={a.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/3 border border-white/6 hover:shadow-sm transition">
                  <div className="flex items-center gap-3">
                    <BankLogo bank={a.bank} currency={a.currency} size={44} />
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-[0.18em]">{a.bank}</p>
                      <p className="text-white font-semibold">{a.label}</p>
                      <p className="text-white/60 mt-1">{a.number} <span className="ml-2 text-white/50 text-sm">{a.currency}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { copy(a.number, a.id); }} aria-label={`Copy ${a.number}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 text-white/90">
                      {copied === a.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button onClick={() => { setQrText(`${a.bank} — ${a.label}\nAccount: ${a.number}\nCurrency: ${a.currency}`); setQrTitle(`${a.bank} — ${a.label}`); setQrOpen(true); }} aria-label={`Show QR for ${a.number}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 text-white/90">
                      <QrCode size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section>
          <h3 className="text-white font-semibold mb-4">Domiciliary Account</h3>
          <div className="grid gap-3 max-w-2xl">
            {DOMICILIARY.map((a) => (
              <article key={a.id} className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-b from-white/5 to-white/3 border border-white/6 hover:shadow-lg transition-transform transform hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <BankLogo bank={a.bank} currency={a.currency} />
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-[0.18em]">{a.bank}</p>
                      <p className="text-white font-semibold text-lg mt-2">{a.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-white/50 text-sm">{a.currency}</div>
                    <button onClick={() => { copy(a.number, a.id); }} aria-label={`Copy ${a.number}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-church-accent/10 text-church-accent font-semibold">
                      {copied === a.id ? <Check size={14} /> : <Copy size={14} />} <span className="hidden sm:inline">Copy</span>
                    </button>
                    <button onClick={() => { setQrText(`${a.bank} — ${a.label}\nAccount: ${a.number}\nCurrency: ${a.currency}`); setQrTitle(`${a.bank} — ${a.label}`); setQrOpen(true); }} aria-label={`Show QR for ${a.number}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 text-white/90">
                      <QrCode size={14} /> <span className="hidden sm:inline">QR</span>
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-white font-extrabold text-2xl tracking-tight">{a.number}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      </div>
      {qrOpen && <QRCodeModal text={qrText} open={qrOpen} onClose={() => setQrOpen(false)} title={qrTitle} />}
    </>
  );
}
