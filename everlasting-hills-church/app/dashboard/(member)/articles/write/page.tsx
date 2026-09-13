import { Suspense } from "react";
import ArticleEditor from "@/components/dashboard/member/articles/ArticleEditor";

export const metadata = { title: "Write — Dashboard" };

/**
 * The editor reads the passage to write about, and the piece being edited, from
 * the query string, so it needs a Suspense boundary to prerender.
 */
export default function WriteArticlePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-full md:px-5 py-10" />}>
      <ArticleEditor />
    </Suspense>
  );
}
