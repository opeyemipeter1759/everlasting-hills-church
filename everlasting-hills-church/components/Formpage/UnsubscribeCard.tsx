"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api/axios";

/** Confirms, then stops the daily fasting emails for the address in the link. */
export default function UnsubscribeCard() {
  const params = useSearchParams();
  const email = params?.get("e") ?? "";
  const token = params?.get("t") ?? "";
  const [state, setState] = useState<"ask" | "working" | "done" | "error">("ask");

  async function confirm() {
    setState("working");
    try {
      await apiClient.post("/email/unsubscribe", { email, token });
      setState("done");
    } catch {
      setState("error");
    }
  }

  const valid = email && token;
  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center text-gray-900 shadow-2xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#87102C]">Everlasting Hills Church</p>
      {state === "done" ? (
        <>
          <h1 className="mt-3 text-2xl font-bold">You&apos;re unsubscribed</h1>
          <p className="mt-2 text-sm text-gray-500">We won&apos;t send {email} any more of these emails. God bless you.</p>
        </>
      ) : !valid ? (
        <>
          <h1 className="mt-3 text-2xl font-bold">This link isn&apos;t complete</h1>
          <p className="mt-2 text-sm text-gray-500">Please use the “Stop these daily emails” link at the bottom of the email.</p>
        </>
      ) : (
        <>
          <h1 className="mt-3 text-2xl font-bold">Stop these emails?</h1>
          <p className="mt-2 text-sm text-gray-500">
            {email} will no longer receive the church&apos;s daily fasting emails.
          </p>
          {state === "error" && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              That didn&apos;t work — the link may be out of date. Please try the link in your latest email.
            </p>
          )}
          <button
            type="button"
            onClick={confirm}
            disabled={state === "working"}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-church-maroon to-burgundy-light py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {state === "working" ? "Unsubscribing…" : "Unsubscribe"}
          </button>
        </>
      )}
    </div>
  );
}
