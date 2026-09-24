"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { useRequestTrackingLink } from "@/lib/api/pledges";
import { userMessageForError } from "@/lib/api/user-message";

/**
 * For someone who pledged without an account and no longer has their private
 * link. They give the address they pledged with and the link is emailed again.
 * The page never says whether that address has a pledge — that would let a
 * stranger find out who gives to the church.
 */
export default function PledgeTrackingLookup() {
  const request = useRequestTrackingLink();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter the email address you pledged with");
      return;
    }
    try {
      await request.mutateAsync(email.trim());
      setSent(true);
    } catch (caught) {
      setError(userMessageForError(caught, "We couldn't send the link. Please try again shortly."));
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf7] px-5 py-28 text-[#211317]">
      <div className="w-full max-w-md rounded-[2rem] border border-[#ead8cd] bg-white p-4 xs:p-7 shadow-2xl shadow-[#3f0615]/10 sm:p-9">
        {sent ? (
          <div role="status" className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <MailCheck size={32} aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-2xl font-black tracking-tight">Check your email</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#6d565b]">
              If a pledge was made with <strong>{email.trim()}</strong>, the private tracking link is on its
              way there. It replaces any earlier link, so use the newest email.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[#806970]">
              Nothing arrived? Check your spam folder, or pledge again if you never finished the form.
            </p>
            <Link
              href="/pledge"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#87102C] px-6 font-bold text-white hover:bg-[#6f0d24]"
            >
              Back to the project pledge
            </Link>
          </div>
        ) : (
          <>
            <Link href="/pledge" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#87102C] hover:underline">
              <ArrowLeft size={16} aria-hidden="true" /> Back to project pledge
            </Link>
            <h1 className="mt-4 text-2xl font-black tracking-tight">Find my pledge</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#6d565b]">
              Pledged without an account? Enter the email address you used and we&apos;ll send your private
              tracking link again, so you can record what you have given.
            </p>
            <form noValidate onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="tracking-email" className="block text-sm font-semibold">
                  Email address
                </label>
                <input
                  id="tracking-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "tracking-email-error" : undefined}
                  className={`block min-h-12 w-full rounded-xl border bg-white px-3.5 text-base outline-none transition focus:border-[#87102C] focus:ring-2 focus:ring-[#87102C]/20 ${
                    error ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {error && (
                  <p id="tracking-email-error" role="alert" className="text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={request.isPending}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#87102C] px-6 font-black text-white hover:bg-[#6f0d24] disabled:opacity-60"
              >
                {request.isPending && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
                {request.isPending ? "Sending…" : "Email me my link"}
              </button>
            </form>
            <p className="mt-5 text-xs leading-relaxed text-[#806970]">
              Pledged while signed in to a church account? Your pledge is on your{" "}
              <Link href="/dashboard" className="font-bold text-[#87102C] hover:underline">
                dashboard
              </Link>{" "}
              instead.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
