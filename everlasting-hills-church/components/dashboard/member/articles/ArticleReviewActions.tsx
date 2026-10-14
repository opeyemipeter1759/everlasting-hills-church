"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useReviewArticle, type Article } from "@/lib/api/articles";
import type { ApiError } from "@/lib/api/axios";

/** The reviewer's verdict at the foot of a piece waiting for approval. */
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
    <section aria-label="Review this article" className="m-paper mt-12 border m-rule p-5 sm:p-6">
      <h2 className="m-ink text-xl font-bold">Your review</h2>
      <p className="m-muted mt-1 text-sm">Approving publishes this version to the church and the public blog.</p>
      <label htmlFor="article-review-note" className="m-ink mt-5 block text-sm">
        Feedback to the author
      </label>
      <p id="article-review-note-help" className="m-muted mt-1 text-[13px]">
        Optional when approving; needed when asking for changes.
      </p>
      <textarea
        id="article-review-note"
        aria-describedby="article-review-note-help"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={1_000}
        rows={4}
        disabled={review.isPending}
        className="m-input m-serif mt-2 resize-y"
      />
      {error && (
        <p role="alert" className="m-ink mt-3 text-sm">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button type="button" disabled={review.isPending} onClick={() => void decide("approve")} className="m-pill">
          {review.isPending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
          Approve and publish
        </button>
        <button type="button" disabled={review.isPending} onClick={() => void decide("request-changes")} className="m-pill-outline">
          Request changes
        </button>
      </div>
    </section>
  );
}
