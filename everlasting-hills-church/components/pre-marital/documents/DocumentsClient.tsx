"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiError } from "@/lib/api/axios";
import { exchangeToken, loadPage, type CouplePage } from "@/lib/api/premarital-documents";
import { CodeStep } from "./CodeStep";
import { DocumentCard } from "./DocumentCard";

type Stage = "opening" | "code" | "ready" | "no-link" | "not-ready";

/** Reads the token after "#", wipes it from the address bar and history at once, and hands it to the API. */
export function takeTokenFromAddress(): string | null {
  const match = /(?:^#|&)t=([A-Za-z0-9_-]{20,200})/.exec(window.location.hash);
  if (!window.location.hash) return null;
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return match?.[1] ?? null;
}

const message = (e: unknown) => (e as ApiError)?.message ?? "Something went wrong. Please try again.";

/** The couple's documents page: link, then code, then one card per document. */
export default function DocumentsClient() {
  const [stage, setStage] = useState<Stage>("opening");
  const [page, setPage] = useState<CouplePage | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setPage(await loadPage());
      setStage("ready");
    } catch (e) {
      setStage((e as ApiError).status === 503 ? "not-ready" : "no-link");
      setProblem(message(e));
    }
  }, []);

  useEffect(() => {
    const token = takeTokenFromAddress();
    if (!token) {
      void refresh();
      return;
    }
    exchangeToken(token)
      .then((next) => (next === "READY" ? refresh() : setStage("code")))
      .catch((e: unknown) => {
        setStage((e as ApiError).status === 503 ? "not-ready" : "no-link");
        setProblem(message(e));
      });
  }, [refresh]);

  if (stage === "opening") return <p className="text-white/75" role="status">Opening your documents page…</p>;
  if (stage === "no-link" || stage === "not-ready")
    return (
      <div role="alert" className="rounded-2xl border border-white/15 bg-white/[0.06] p-6">
        <p className="font-semibold text-white">{stage === "not-ready" ? "Uploads are not open yet" : "We could not open your documents page"}</p>
        <p className="mt-2 text-white/75">
          {stage === "not-ready"
            ? problem
            : "Please open the secure link in the email we sent you. If it has stopped working, the church office can send you a new one. You can also bring your documents to the church office."}
        </p>
      </div>
    );
  if (stage === "code") return <CodeStep onVerified={refresh} />;
  if (!page) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-2xl text-white sm:text-3xl">Hello {page.firstNames.join(" and ")}</p>
        <p className="mt-1 text-sm text-white/70">
          Application reference <span className="font-semibold text-white">{page.reference}</span>
        </p>
        <p className="mt-3 max-w-2xl text-white/80">
          {page.uploadsEnabled
            ? `Upload each document when it is ready, or bring it to the church office. Documents you upload are kept securely, and you will not see them here again once they are sent. PDF, JPG or PNG, up to ${page.maxUploadMb} MB each.`
            : "Online uploads are not open yet. Please bring your documents to the church office."}
        </p>
      </div>
      <ul className="space-y-4">
        {page.documents.map((d) => (
          <li key={d.kind}>
            <DocumentCard doc={d} consentWording={page.medicalConsentWording} maxMb={page.maxUploadMb} onChanged={refresh} />
          </li>
        ))}
      </ul>
    </div>
  );
}
