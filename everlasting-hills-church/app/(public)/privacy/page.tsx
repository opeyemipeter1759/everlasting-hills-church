import LegalLayout from "@/components/marketing/LegalLayout";
import LegalSections, { type LegalContent } from "@/components/marketing/LegalSections";
import GoogleDataPolicy from "@/components/marketing/GoogleDataPolicy";
import { getStructuredContent } from "@/lib/cms-page";
import { getSiteConfig } from "@/lib/site-config";

export const metadata = {
  title: "Privacy Policy — Everlasting Hills Church",
  description:
    "How Everlasting Hills Church collects, uses, and protects your personal information.",
};

const FALLBACK: LegalContent = {
  eyebrow: "Legal",
  title: "Privacy",
  accent: "Policy",
  updated: "23 September 2026",
  intro: "Everlasting Hills Church values your trust. This policy explains what information we collect, why we collect it, and how we keep it safe.",
  sections: [
    { heading: "Information we collect", body: "- Contact details you provide through our forms (name, email, phone).\n- Membership and attendance records when you join or check in.\n- Prayer requests, testimonies, and messages you choose to share.\n- Basic technical data such as device and browser information." },
    { heading: "How we use your information", body: "- To welcome, follow up with, and care for you as part of the church family.\n- To send service updates, event details, and communications you opt into.\n- To improve our website, services, and pastoral care." },
    { heading: "How we protect it", body: "We apply reasonable technical and organisational measures to guard your information. Access is limited to authorised leaders and staff who need it to serve you." },
    { heading: "Your choices", body: "You may request access to, correction of, or deletion of your personal data at any time. You can also opt out of non-essential communications." },
    { heading: "Contact us", body: "For any privacy question or request, email us at hello@everlastinghills.org." },
  ],
};

function isLegal(c: unknown): c is LegalContent {
  return Boolean(c && Array.isArray((c as LegalContent).sections));
}

export default async function PrivacyPage({ searchParams }: { searchParams: { preview?: string } }) {
  const [c, site] = await Promise.all([
    getStructuredContent("privacy", { preview: searchParams.preview, fallback: FALLBACK, valid: isLegal }),
    getSiteConfig(),
  ]);
  return (
    <LegalLayout eyebrow={c.eyebrow} title={c.title} accent={c.accent} updated={c.updated}>
      <LegalSections content={c} />
      {/* Outside the CMS content on purpose — see GoogleDataPolicy. */}
      <GoogleDataPolicy contactEmail={site.contactEmail} />
    </LegalLayout>
  );
}
