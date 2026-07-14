import { getAllSiteSettings } from "@/lib/site-settings";
import HomeCellContent from "./_components/home-cell-content";

// Revalidate every 5 minutes to pick up CMS hero image changes.
export const revalidate = 300;

export default async function HomeCellPage() {
  const settings = await getAllSiteSettings();
  // Use the first carousel image uploaded via the CMS dashboard.
  // Falls back to the local congregation photo if R2 has no images yet.
  const heroImageUrl =
    settings.HERO.carouselImages?.[0] ??
    "/images/church_congregation_1_1779193592146.png";

  return <HomeCellContent heroImageUrl={heroImageUrl} />;
}
