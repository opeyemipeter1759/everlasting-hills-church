import { getStructuredContent } from "@/lib/cms-page";
import GiveClient, { type GiveContent, type WireSection } from "@/components/give/GiveClient";

const usdWire: WireSection[] = [
  {
    title: "Correspondence Details",
    fields: [
      { label: "Name", value: "UBA, NEW YORK" },
      { label: "BIC", value: "UNAFUS33" },
      { label: "Routing Number", value: "026000110" },
    ],
  },
  {
    title: "Beneficiary Bank",
    fields: [
      { label: "Name", value: "GLOBUS BANK LIMITED" },
      { label: "BIC", value: "GLOUNGLA" },
      { label: "Account Nos", value: "50017150003629" },
    ],
  },
  {
    title: "For Final Credit To",
    fields: [
      { label: "Beneficiary Account Name", value: "EVERLASTING HEIGHTS MINISTRIES" },
      { label: "Beneficiary Account Number", value: "1000596249" },
    ],
  },
];

const gbpWire: WireSection[] = [
  {
    title: "Intermediary Details",
    fields: [
      { label: "Name", value: "STANDARD CHARTERED BANK, LONDON" },
      { label: "BIC", value: "SCBLGB2L" },
    ],
  },
  {
    title: "Correspondence Details",
    fields: [
      { label: "Account Number/IBAN", value: "GB98SCBL60910412683946" },
      { label: "Sort Code", value: "609104" },
      { label: "Account Name", value: "UBA, NEW YORK" },
      { label: "BIC", value: "UNAFUS33" },
    ],
  },
  {
    title: "Beneficiary Bank",
    fields: [
      { label: "Name", value: "GLOBUS BANK LIMITED" },
      { label: "BIC", value: "GLOUNGLA" },
      { label: "Account Nos", value: "50017150003636" },
    ],
  },
  {
    title: "For Final Credit To",
    fields: [
      { label: "Beneficiary Account Name", value: "EVERLASTING HEIGHTS MINISTRIES" },
      { label: "Beneficiary Account Number", value: "1000596311" },
    ],
  },
];

const eurWire: WireSection[] = [
  {
    title: "Intermediary Details",
    fields: [
      { label: "Name", value: "STANDARD CHARTERED BANK, GERMANY" },
      { label: "BIC", value: "SCBLDEFX" },
    ],
  },
  {
    title: "Correspondence Details",
    fields: [
      { label: "Account Number/IBAN", value: "DE26512305000500031810" },
      { label: "Account Name", value: "UBA, NEW YORK" },
      { label: "BIC", value: "UNAFUS33" },
    ],
  },
  {
    title: "Beneficiary Bank",
    fields: [
      { label: "Name", value: "GLOBUS BANK LIMITED" },
      { label: "BIC", value: "GLOUNGLA" },
      { label: "Account Nos", value: "50017150003643" },
    ],
  },
  {
    title: "For Final Credit To",
    fields: [
      { label: "Beneficiary Account Name", value: "To be provided" },
      { label: "Beneficiary Account Number", value: "To be provided" },
    ],
  },
];

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
  heroImage: "/images/church_congregation_2_1779193607195.png",
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
    { bank: "Globus Bank", purpose: "USD Domiciliary", number: "1000596249", currency: "USD", wire: usdWire },
    { bank: "Globus Bank", purpose: "GBP Domiciliary", number: "1000596311", currency: "GBP", wire: gbpWire },
    { bank: "Globus Bank", purpose: "EUR Domiciliary", number: "To be provided", currency: "EUR", wire: eurWire },
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
