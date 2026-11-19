import type { Metadata } from "next";
import Image from "next/image";
import PreMaritalApplication from "@/components/pre-marital/PreMaritalApplication";

export const metadata: Metadata = {
  title: "Pre-Marital Counselling · Everlasting Hills Church",
  description:
    "Planning to marry? Apply together for pre-marital counselling with the pastors of Everlasting Hills Church, and we will contact you about next steps.",
};

export default function PreMaritalCounsellingPage() {
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
          className="scale-105 object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-church-dark via-church-dark/50 to-church-dark" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <header className="mb-8 mt-20 text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Pre-Marital Counselling</h1>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-white/80">
            Getting married is one of the biggest steps you will take together. Our pastors walk with couples through
            pre-marital counselling, so you can build your marriage on God&apos;s word and talk honestly about the
            things that matter before the big day.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/65">
            Fill this in together. The pastoral team will review your application and contact you both about next
            steps. Applying does not book a session yet.
          </p>
        </header>

        <PreMaritalApplication />
      </div>
    </main>
  );
}
