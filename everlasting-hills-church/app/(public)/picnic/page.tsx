import type { Metadata } from "next";
import PicnicLanding from "@/components/picnic/PicnicLanding";
import { PHOTOS, formatPicnicDate, picnicDate } from "@/components/picnic/picnic-config";

const date = formatPicnicDate(picnicDate());
const description = `Pack a blanket — the Everlasting Hills Church end-of-year picnic is on ${date.long}. Save your spot and bring a friend.`;

export const metadata: Metadata = {
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

export const revalidate = 3600;

export default function PicnicPage() {
  return <PicnicLanding />;
}
