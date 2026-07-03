import { getStructuredContent } from "@/lib/cms-page";
import GiveClient, { type GiveContent } from "@/components/give/GiveClient";

export const metadata = {
  title: "Give — Everlasting Hills Church",
  description:
    "Support the mission of Everlasting Hills Church through your generous giving by bank transfer.",
};

const FALLBACK: GiveContent = {
  eyebrow: "Give",
  titleTop: "Your",
  accentTop: "Generosity",
  titleBottom: "Our",
  accentBottom: "Mission",
  subtitle:
    "Your gifts fuel worship, outreach, and pastoral care, carrying the gospel unto the utmost bound of the everlasting hills.",
  sectionLabel: "Ways to Give",
  headingLead: "Give by",
  headingAccent: "bank transfer",
  accountName: "EVERLASTING HEIGHTS MINISTRIES",
  local: [
    { bank: "Globus Bank", purpose: "Tithe & Offering", number: "2007044595", currency: "NGN" },
    { bank: "Globus Bank", purpose: "Rent", number: "2007060182", currency: "NGN" },
    { bank: "Globus Bank", purpose: "Building / Project", number: "2007060223", currency: "NGN" },
  ],
  domiciliary: [
    { bank: "Globus Bank", purpose: "USD Domiciliary", number: "1000596249", currency: "USD" },
    { bank: "Globus Bank", purpose: "GBP Domiciliary", number: "1000596311", currency: "GBP" },
  ],
};

function isValid(c: unknown): c is GiveContent {
  const g = c as GiveContent;
  return Boolean(g && Array.isArray(g.local) && Array.isArray(g.domiciliary) && g.accountName);
}

export default async function GivePage({ searchParams }: { searchParams: { preview?: string } }) {
  const c = await getStructuredContent("give", {
    preview: searchParams.preview,
    fallback: FALLBACK,
    valid: isValid,
  });

  return <GiveClient content={c} preview={Boolean(searchParams.preview)} />;
}
