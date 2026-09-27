import type { Metadata } from "next";
import EvangelismPublicForm from "@/components/evangelism/EvangelismPublicForm";

export const metadata: Metadata = {
  title: "Evangelism Form — Everlasting Hills Church",
  description: "For the Everlasting Hills Evangelism Team: record the people you preach to.",
  robots: { index: false, follow: false },
};

/**
 * The form the Evangelism Team opens on their phones during outreach. Kept
 * deliberately light — no site navbar, images or animation — so it loads on a
 * weak connection at the roadside.
 */
export default function EvangelismFormPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F5] px-4 pb-16 pt-6 text-gray-900 sm:pt-10">
      <div className="mx-auto w-full max-w-xl">
        <EvangelismPublicForm />
      </div>
    </main>
  );
}
