import DirectionsSection from "./DirectionsSection";
import GivingSection from "./GivingSection";
import Footer from "./Footer";

/**
 * Site-wide bottom slab: Directions → Giving → Footer.
 *
 * Rendered by the public AND auth layouts so every landing/login page surfaces the
 * same calls to action ("find us", "give") + the standard footer. Single source of
 * truth — change the order or styling here and it updates everywhere.
 *
 * Wrapping bg: `bg-church-dark` so when used on top of a light-themed page (e.g.
 * the white card on /sermons/[slug]) the slab visually grounds the page in the
 * brand dark palette.
 */
export default function PageFooter() {
  return (
    <div className="bg-church-dark pt-16">
      <DirectionsSection />
      <GivingSection />
      <Footer />
    </div>
  );
}
