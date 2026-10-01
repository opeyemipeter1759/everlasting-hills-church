import type { Metadata } from "next";
import { Suspense } from "react";
import UnsubscribeCard from "@/components/Formpage/UnsubscribeCard";

export const metadata: Metadata = {
  title: "Unsubscribe — Everlasting Hills Church",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-church-dark px-4 py-24 text-white">
      <Suspense>
        <UnsubscribeCard />
      </Suspense>
    </main>
  );
}
