import EditorialCarousel, { type CarouselSlide } from "./editorial-carousel";
import { CAROUSEL_FALLBACK, type CarouselContent } from "@/lib/site-settings";

export default function Carousel({ content }: { content?: CarouselContent }) {
  const c = content ?? CAROUSEL_FALLBACK;
  const slides: CarouselSlide[] = c.images.map((image, i) => ({
    id: `slide-${i + 1}`,
    index: String(i + 1).padStart(2, "0"),
    image,
  }));

  return (
    <EditorialCarousel
      items={slides}
      autoPlay
      delay={5000}
      eyebrow={c.eyebrow}
      headline={c.headline}
    />
  );
}
