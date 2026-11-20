"use client";

import { useState, type FormEvent } from "react";
import type { ApiError } from "@/lib/api/axios";
import { sendCode, verifyCode } from "@/lib/api/premarital-documents";

/** The emailed six-digit code that keeps a forwarded link from opening the page. */
export function CodeStep({ onVerified }: { onVerified: () => void }) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function ask() {
    setBusy(true);
    setProblem(null);
    try {
      await sendCode();
      setSent(true);
    } catch (e) {
      setProblem((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  async function check(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setProblem("Enter the six digits from the email.");
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      await verifyCode(code.trim());
      onVerified();
    } catch (e) {
      setProblem((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 sm:p-8">
      <h2 className="text-lg font-bold">First, a quick check</h2>
      <p className="mt-2 text-gray-700">
        To keep your documents safe, we will email a six-digit code to the address you applied with. It works for 10 minutes.
      </p>
      {!sent ? (
        <button
          type="button"
          onClick={ask}
          disabled={busy}
          className="mt-5 min-h-11 rounded-xl bg-church-maroon px-6 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-church-maroon/40 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {busy ? "Sending…" : "Email me a code"}
        </button>
      ) : (
        <form onSubmit={check} noValidate className="mt-5 space-y-3">
          <label htmlFor="pmd-code" className="block text-sm font-semibold">
            Code from the email
          </label>
          <input
            id="pmd-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            aria-describedby={problem ? "pmd-code-problem" : undefined}
            className="block w-40 rounded-xl border-2 border-gray-300 px-4 py-2.5 text-lg tracking-[0.3em] focus:border-church-maroon focus:outline-none"
          />
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className="min-h-11 rounded-xl bg-church-maroon px-6 font-semibold text-white disabled:opacity-60">
              {busy ? "Checking…" : "Continue"}
            </button>
            <button type="button" onClick={ask} disabled={busy} className="min-h-11 rounded-xl border-2 border-gray-300 px-5 font-semibold text-gray-800">
              Send a new code
            </button>
          </div>
        </form>
      )}
      {problem && (
        <p id="pmd-code-problem" role="alert" className="mt-3 text-sm text-red-700">
          {problem}
        </p>
      )}
    </div>
  );
}
