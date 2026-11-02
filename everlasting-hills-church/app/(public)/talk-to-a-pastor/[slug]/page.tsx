import type { Metadata } from "next";
import TalkHero from "@/components/one-on-one-public/TalkHero";
import VisitorFlow from "@/components/one-on-one-public/VisitorFlow";

/** "pastor-faith-peter" → "Pastor Faith Peter", for the link preview a share shows. */
function nameFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const name = nameFromSlug(params.slug);
  const title = `One-on-One with ${name} | Everlasting Hills Church`;
  const description = `Request a private session with ${name} to talk, pray and receive counsel, by video call or phone.`;
  return { title, description, openGraph: { title, description } };
}

export default function PastorBookingPage({ params }: { params: { slug: string } }) {
  const name = nameFromSlug(params.slug);
  return (
    <main className="bg-[#FBF7F8] dark:bg-[#130A0D]">
      <TalkHero
        heading={`Sit down with ${name}.`}
        lead="Pick a time that suits you for a private session to talk, pray and receive counsel. Nothing is booked until the pastor approves it."
      />
      <div className="mx-auto max-w-[1100px] px-5 py-12 sm:px-8 sm:py-16">
        <VisitorFlow slug={params.slug} />
      </div>
    </main>
  );
}
