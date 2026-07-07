import type { CarouselSlide } from "./types";

const images = [
  "/HeroImages/1.jpg",
  "/HeroImages/2.jpg",
  "/HeroImages/3.jpg",
  "/HeroImages/4.jpg",
  "/HeroImages/21.jpg",
  "/HeroImages/IMG_101.jpg",
  "/HeroImages/IMG_1080.jpg",
  "/HeroImages/IMG_4565.jpg",
  "/HeroImages/IMG_4667.jpg",
  "/HeroImages/IMG_5684.jpg",
  "/HeroImages/IMG_8248.jpg",
  "/HeroImages/IMG_8470.jpg",
  "/HeroImages/IMG_8931.jpg",
  "/HeroImages/IMG_9.jpg",
  "/HeroImages/IMG_9003.jpg",
  "/HeroImages/IMG_9014.jpg",
  "/HeroImages/1.jpg",
  "/HeroImages/2.jpg",
  "/HeroImages/3.jpg",
  "/HeroImages/4.jpg",
];

export const carouselSlides: CarouselSlide[] = images.map((image, i) => ({
  id: `slide-${i + 1}`,
  index: String(i + 1).padStart(2, "0"),
  image,
}));
