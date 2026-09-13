"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useReviewArticle, type Article } from "@/lib/api/articles";
import type { ApiError } from "@/lib/api/axios";

export default function ArticleReviewActions({ article }: { article: Article }) {
  const router = useRouter();
  const review = useReviewArticle();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "approve" | "request-changes") {
    if (decision === "request-changes" && note.trim().length < 3) {
      setError("Explain the changes the author should make before returning this article.");
      return;
    }
    setError(null);
    try {
      await review.mutateAsync({ id: article.id, revision: article.revision, decision, note: note.trim() || undefined });
      router.push("/dashboard/articles/review");
    } catch (err) {
      setError((err as ApiError)?.message || "The review could not be saved. Please try again.");
    }
  }

  return (
    <section aria-label="Review this article" className="mt-10 rounded-2xl border border-[#E7CDD3] bg-[#FFF4F6]/60 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
      <h2 className="text-lg font-bold text-[#111] dark:text-white">Your review</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-white/60">Approval publishes this version to the church feed.</p>
      <label htmlFor="article-review-note" className="mt-4 block text-sm font-semibold dark:text-white">Feedback to the author</label>
      <p id="article-review-note-help" className="mt-1 text-xs text-gray-500 dark:text-white/50">Optional for approval; required when requesting changes.</p>
      <textarea id="article-review-note" aria-describedby="article-review-note-help" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1_000} rows={4} disabled={review.isPending} className="mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-base text-gray-900 dark:border-white/10 dark:bg-black/20 dark:text-white" />
      {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button type="button" disabled={review.isPending} onClick={() => void decide("approve")} className="min-h-11 rounded-xl bg-[#87102C] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{review.isPending ? "Saving review..." : "Approve and publish"}</button>
        <button type="button" disabled={review.isPending} onClick={() => void decide("request-changes")} className="min-h-11 rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 disabled:opacity-50 dark:border-white/20 dark:text-white">Request changes</button>
      </div>
    </section>
  );
}
