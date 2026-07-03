import LegalLayout from "@/components/marketing/LegalLayout";
import LegalSections, { type LegalContent } from "@/components/marketing/LegalSections";
import { getStructuredContent } from "@/lib/cms-page";

export const metadata = {
  title: "Terms of Service — Everlasting Hills Church",
  description:
    "The terms that govern your use of the Everlasting Hills Church website and online services.",
};

const FALLBACK: LegalContent = {
  eyebrow: "Legal",
  title: "Terms of",
  accent: "Service",
  updated: "18 June 2026",
  intro: "Welcome to the Everlasting Hills Church website. By using this site and our online services, you agree to the terms below. Please read them carefully.",
  sections: [
    { heading: "Use of the site", body: "You agree to use this website lawfully and respectfully, and not to misuse, disrupt, or attempt to gain unauthorised access to any part of it or its underlying systems." },
    { heading: "Accounts", body: "- You are responsible for keeping your login details secure.\n- You agree to provide accurate information when you register.\n- We may suspend accounts that breach these terms or are misused." },
    { heading: "Submissions and content", body: "Prayer requests, testimonies, and other content you submit may be read by our pastoral team. Do not submit unlawful, harmful, or content you do not have the right to share." },
    { heading: "Giving", body: "Online giving is processed securely through our payment partner. Gifts are voluntary and, unless stated otherwise, non-refundable. Receipts are issued for your records." },
    { heading: "Changes", body: "We may update these terms from time to time. Continued use of the site after changes means you accept the updated terms." },
    { heading: "Contact us", body: "Questions about these terms? Email us at hello@everlastinghills.org." },
  ],
};

function isLegal(c: unknown): c is LegalContent {
  return Boolean(c && Array.isArray((c as LegalContent).sections));
}

export default async function TermsPage({ searchParams }: { searchParams: { preview?: string } }) {
  const c = await getStructuredContent("terms", { preview: searchParams.preview, fallback: FALLBACK, valid: isLegal });
  return (
    <LegalLayout eyebrow={c.eyebrow} title={c.title} accent={c.accent} updated={c.updated}>
      <LegalSections content={c} />
    </LegalLayout>
  );
}
