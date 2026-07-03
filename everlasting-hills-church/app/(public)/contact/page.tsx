import CosmicContactHero from "@/components/home/CosmicContactHero";
import { getStructuredContent } from "@/lib/cms-page";

export const metadata = {
  title: "Find Us — Everlasting Hills Church",
  description: "Address, phone, email, and directions to Everlasting Hills Church, Ibadan.",
};

interface ContactContent {
  eyebrow: string;
  title: string;
  accent: string;
  subtitle: string;
}

const FALLBACK: ContactContent = {
  eyebrow: "Get in Touch",
  title: "Connect",
  accent: "With Us",
  subtitle:
    "We would love to hear from you. Reach out — there is always a place for you in the Everlasting Hills family.",
};

function isValid(c: unknown): c is ContactContent {
  const v = c as ContactContent;
  return Boolean(v && v.title && v.accent && v.subtitle);
}

/**
 * Cosmic-themed Find Us / Contact page. Hero copy is CMS-editable; the actual
 * hero (WebGL globe, directions modal, contact links from Site Settings) lives
 * in the CosmicContactHero client component.
 */
export default async function ContactPage({ searchParams }: { searchParams: { preview?: string } }) {
  const c = await getStructuredContent("contact", {
    preview: searchParams.preview,
    fallback: FALLBACK,
    valid: isValid,
  });

  return (
    <>
      {searchParams.preview && (
        <div className="bg-[#87102C] text-white text-center text-xs font-semibold py-2 tracking-wide">
          PREVIEW — draft, not published
        </div>
      )}
      <CosmicContactHero eyebrow={c.eyebrow} title={c.title} accent={c.accent} subtitle={c.subtitle} />
    </>
  );
}
