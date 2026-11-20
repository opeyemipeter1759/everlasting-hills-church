import type { Metadata } from "next";
import DocumentsClient from "@/components/pre-marital/documents/DocumentsClient";

export const metadata: Metadata = {
  title: "Your counselling documents · Everlasting Hills Church",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

/**
 * The couple's secure documents page. Opened from the link in their email
 * (the token sits after "#", so it never reaches a server); a scoped upload
 * page, not an account.
 */
export default function CounsellingDocumentsPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-church-dark px-4 pb-24 pt-28 text-white sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="sr-only">Your pre-marital counselling documents</h1>
        <DocumentsClient />
      </div>
    </main>
  );
}
