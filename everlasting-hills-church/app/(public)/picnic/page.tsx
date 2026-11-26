import type { Metadata } from "next";
import PicnicLanding from "@/components/picnic/PicnicLanding";
import { PICNIC_FALLBACK, dateParts, isPicnicContent } from "@/components/picnic/picnic-content";
import { atWidth, picnicPhoto } from "@/components/picnic/picnic-photos";
import { getStructuredContent } from "@/lib/cms-page";

const load = (preview?: string) => getStructuredContent("picnic", { preview, fallback: PICNIC_FALLBACK, valid: isPicnicContent });

export async function generateMetadata(): Promise<Metadata> {
  const c = await load();
  const { long } = dateParts(c.date);
  const hero = picnicPhoto(c.photos, "hero");
  const description = `Grab a mat and come hang out: the Everlasting Hills Church end-of-year picnic${long ? ` is on ${long}` : " is coming"}. Save your spot and bring a friend.`;
  return {
    title: "The EHC Picnic — Everlasting Hills Church",
    description,
    // What WhatsApp / Instagram show when someone pastes the link.
    openGraph: {
      title: [c.headline, c.headlineMiddle, c.headlineAccent].join(" "),
      description,
      // Stock photo: known size. An upload: let the app read its size.
      images: [hero.credit ? { url: atWidth(hero.src, 1200), width: 1200, height: 1500, alt: hero.alt } : { url: hero.src, alt: hero.alt }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export const revalidate = 3600;

/** Words, date, time, venue, games and photos come from the CMS (Public Site → Picnic); the layout stays fixed. */
export default async function PicnicPage({ searchParams }: { searchParams: { preview?: string } }) {
  return <PicnicLanding c={await load(searchParams.preview)} />;
}
