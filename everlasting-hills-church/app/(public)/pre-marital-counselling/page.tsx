import type { Metadata } from "next";
import PremaritalForm from "@/components/pre-marital/PremaritalForm";
import { Hero, WhyItMatters } from "@/components/pre-marital/sections/Intro";
import { CounsellingTeam } from "@/components/pre-marital/sections/Journey";
import { getPremaritalPage } from "@/lib/premarital-page";

export const metadata: Metadata = {
  title: "Pre-Marital Counselling · Everlasting Hills Church",
  description:
    "Preparing for a marriage that flourishes. Apply for pre-marital counselling with Everlasting Hills Church, and the pastoral team will contact you about next steps.",
};

export const revalidate = 300;

/** A server-rendered page; the application form is the only part that runs in the browser. */
export default async function PreMaritalCounsellingPage() {
  const { policy } = await getPremaritalPage();
  return (
    <main className="min-h-screen overflow-x-hidden bg-church-dark px-4 pb-24 text-white selection:bg-church-maroon sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <Hero />
        <WhyItMatters />
        <CounsellingTeam counsellors={policy.counsellors} />

        <section
          id="apply"
          aria-labelledby="apply-heading"
          className="mt-20 scroll-mt-24"
        >
          <h2
            id="apply-heading"
            className="font-display text-2xl font-bold text-white sm:text-3xl"
          >
            Apply for counselling
          </h2>
          <p className="mt-2 max-w-2xl text-white/75">
            One of you can apply for both. The pastoral team will review your
            application and contact you about next steps. Applying does not book
            a session yet.
          </p>
          <div className="mt-6">
            <PremaritalForm />
          </div>
        </section>

        <section
          aria-label="Encouragement"
          className="mt-20 rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-center sm:p-10"
        >
          <p className="font-display text-2xl text-white">
            &ldquo;Unless the Lord builds the house, the builders labour in
            vain.&rdquo;
          </p>
          <p className="mt-2 text-sm text-[#FFB3C1]">Psalm 127:1</p>
          <p className="mx-auto mt-4 max-w-xl text-white/75">
            However far along you are, we would love to walk with you as you
            prepare. We are praying for you both.
          </p>
        </section>
      </div>
    </main>
  );
}
