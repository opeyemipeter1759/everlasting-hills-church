import type { Metadata } from "next";
import PicnicLanding from "@/components/picnic/PicnicLanding";
import { PICNIC_FALLBACK, dateParts, isPicnicContent } from "@/components/picnic/picnic-content";
import { PHOTOS } from "@/components/picnic/picnic-config";
import { getStructuredContent } from "@/lib/cms-page";

const load = (preview?: string) => getStructuredContent("picnic", { preview, fallback: PICNIC_FALLBACK, valid: isPicnicContent });

export async function generateMetadata(): Promise<Metadata> {
  const { long } = dateParts((await load()).date);
  const description = `Pack a blanket — the Everlasting Hills Church end-of-year picnic${long ? ` is on ${long}` : " is coming"}. Save your spot and bring a friend.`;
  return {
    title: "The EHC Picnic — Everlasting Hills Church",
    description,
    // What WhatsApp / Instagram show when someone pastes the link.
    openGraph: {
      title: "Pack a blanket. We're having a picnic.",
      description,
      images: [{ url: PHOTOS.hero.src.replace(/w=\d+/, "w=1200"), width: 1200, height: 1500, alt: PHOTOS.hero.alt }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export const revalidate = 3600;

/** Words, date, time and venue come from the CMS (Public Site → Picnic); the design stays fixed. */
export default async function PicnicPage({ searchParams }: { searchParams: { preview?: string } }) {
  return <PicnicLanding c={await load(searchParams.preview)} />;
}
