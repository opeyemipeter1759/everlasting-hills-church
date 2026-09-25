import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import SalvationForm from "@/components/Formpage/SalvationForm";

export const metadata: Metadata = {
  title: "I Gave My Life to Christ — Everlasting Hills Church",
  description:
    "Tell Everlasting Hills Church that you have given your life to Christ, or come back to Him, and someone will reach out to you personally.",
};

export default function SalvationPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-church-dark px-4 py-12 text-white selection:bg-church-maroon sm:px-5">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Image
          src="/images/church_congregation_3_1779193624434.png"
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          priority
          className="scale-105 object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-church-dark via-church-dark/40 to-church-dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-church-dark/80 via-transparent to-church-dark/80" />
        <div className="absolute inset-0 bg-church-dark/20 backdrop-brightness-[0.8]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[80vh] w-full max-w-2xl items-center justify-center">
        {/* useSearchParams reads the event this came from; Suspense keeps the
            route statically renderable around it. */}
        <Suspense fallback={null}>
          <SalvationForm />
        </Suspense>
      </div>
    </main>
  );
}
