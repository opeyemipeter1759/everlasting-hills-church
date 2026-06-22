"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Home } from "lucide-react";
import { apiClient } from "@/lib/api/axios";

type Status = "verifying" | "success" | "failed";

function CallbackInner() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref");
  const [status, setStatus] = useState<Status>("verifying");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await apiClient.get<{ status: string }>(
          `/giving/verify/${encodeURIComponent(reference)}`,
        );
        if (active) setStatus(res.data?.status === "success" ? "success" : "failed");
      } catch {
        if (active) setStatus("failed");
      }
    })();
    return () => {
      active = false;
    };
  }, [reference]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-church-dark px-5 text-center text-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute right-[-10%] top-[-20%] h-[60%] w-[60%] rounded-full bg-[#87102C]/15 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-md">
        {status === "verifying" && (
          <>
            <Loader2 size={48} className="mx-auto mb-6 animate-spin text-church-accent" />
            <h1 className="text-2xl font-bold">Confirming your gift...</h1>
            <p className="mt-3 text-white/55">This will only take a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 size={56} className="mx-auto mb-6 text-emerald-400" />
            <h1 className="text-balance text-3xl font-bold">Thank you for your gift</h1>
            <p className="mx-auto mt-4 max-w-sm text-white/55">
              Your gift was received successfully. A receipt is on its way to your
              email. May the Lord bless you abundantly.
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle size={56} className="mx-auto mb-6 text-[#e8768a]" />
            <h1 className="text-balance text-3xl font-bold">We could not confirm that</h1>
            <p className="mx-auto mt-4 max-w-sm text-white/55">
              Your payment may not have completed. If you were charged, please
              contact us and we will sort it out right away.
            </p>
          </>
        )}

        {status !== "verifying" && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-7 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24]"
            >
              <Home size={16} />
              Back Home
            </Link>
            <Link
              href="/give"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-white/5"
            >
              Give Again
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function GiveCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
