import type { Metadata } from "next";
import TalkHero from "@/components/one-on-one-public/TalkHero";
import VisitorFlow from "@/components/one-on-one-public/VisitorFlow";

/** "one-on-one-with-pastor-opeyemi-nov-ed" → "One On One With Pastor Opeyemi Nov Ed", for the link preview. */
function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function generateMetadata({ params }: { params: { slug: string; session: string } }): Metadata {
  const session = titleFromSlug(params.session);
  const title = `${session} | Everlasting Hills Church`;
  const description = `Pick a time for ${session}. Nothing is booked until the pastor approves it.`;
  return { title, description, openGraph: { title, description } };
}

export default function SessionBookingPage({ params }: { params: { slug: string; session: string } }) {
  return (
    <main className="bg-[#FBF7F8] dark:bg-[#130A0D]">
      <TalkHero
        heading={titleFromSlug(params.session)}
        lead="Pick a time that suits you. Nothing is booked until the pastor approves it, and you’ll get an email either way."
      />
      <div id="talk-flow" className="mx-auto max-w-[1100px] scroll-mt-20 px-5 py-12 sm:px-8 sm:py-16">
        <VisitorFlow slug={params.slug} sessionSlug={params.session} />
      </div>
    </main>
  );
}
