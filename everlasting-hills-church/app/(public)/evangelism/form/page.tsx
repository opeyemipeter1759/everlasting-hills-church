import type { Metadata } from "next";
import Image from "next/image";
import EvangelismPublicForm from "@/components/evangelism/EvangelismPublicForm";

export const metadata: Metadata = {
  title: "Evangelism Form — Everlasting Hills Church",
  description: "For the Everlasting Hills Evangelism Team: record the people you preach to.",
  robots: { index: false, follow: false },
};

/** The outreach form, dressed like the first-timer and testimony forms. */
export default function EvangelismFormPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-church-dark px-4 py-12 text-white selection:bg-church-maroon sm:px-5">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Image
          src="/images/church_congregation_3_1779193624434.png"
          alt="Everlasting Hills Community"
          fill
          sizes="100vw"
          priority
          className="scale-105 object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-church-dark via-church-dark/40 to-church-dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-church-dark/80 via-transparent to-church-dark/80" />
        <div className="absolute inset-0 bg-church-dark/20 backdrop-brightness-[0.8]" />
      </div>
      <div className="relative z-10 mx-auto max-w-2xl">
        <EvangelismPublicForm />
      </div>
    </main>
  );
}
