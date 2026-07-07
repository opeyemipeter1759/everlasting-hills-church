import EditorialCarousel, { carouselSlides } from "./editorial-carousel";

export default function Carousel() {
  return <EditorialCarousel items={carouselSlides} autoPlay delay={5000} />;
}
