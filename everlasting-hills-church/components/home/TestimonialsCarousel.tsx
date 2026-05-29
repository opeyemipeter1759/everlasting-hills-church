"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

/**
 * Embla-based testimonial slider.
 *
 * - Touch-friendly (Embla handles drag/swipe out of the box)
 * - Autoplay with hover-pause
 * - Keyboard-accessible (focus-visible ring, arrow buttons with aria-label)
 * - Responsive: 1 card on mobile, 2 on tablet, 3 on desktop
 */

export interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string | null;
  authorPhotoUrl: string | null;
  content: string;
  publishedAt: string | null;
}

interface Props {
  testimonials: Testimonial[];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function TestimonialsCarousel({ testimonials }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1 },
    [Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true })],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="relative">
      {/* Viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="pl-4 flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
            >
              <TestimonialCard t={t} />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      {testimonials.length > 1 && (
        <>
          <div className="hidden sm:flex justify-between absolute inset-y-0 -left-3 -right-3 lg:-left-6 lg:-right-6 items-center pointer-events-none">
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Previous testimonial"
              className="pointer-events-auto w-11 h-11 rounded-full bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-[#87102C] hover:border-[#87102C]/30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Next testimonial"
              className="pointer-events-auto w-11 h-11 rounded-full bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-[#87102C] hover:border-[#87102C]/30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Dots */}
          <div className="mt-8 flex justify-center gap-2">
            {scrollSnaps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                aria-current={i === selectedIndex}
                className={`h-2 rounded-full transition-all ${
                  i === selectedIndex
                    ? "w-8 bg-[#87102C]"
                    : "w-2 bg-gray-300 dark:bg-white/20 hover:bg-gray-400 dark:hover:bg-white/30"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <article className="h-full bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl p-7 flex flex-col gap-5 hover:border-[#87102C]/30 transition-colors">
      <Quote className="text-[#87102C]/30 flex-shrink-0" size={32} />

      <blockquote className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed text-[15px]">
        {t.content}
      </blockquote>

      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-white/8">
        {t.authorPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={t.authorPhotoUrl}
            alt=""
            className="w-11 h-11 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <span className="w-11 h-11 rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 text-[#87102C] dark:text-[#e8768a] flex items-center justify-center text-sm font-bold flex-shrink-0">
            {initials(t.authorName)}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {t.authorName}
          </p>
          {t.authorRole && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.authorRole}</p>
          )}
        </div>
      </div>
    </article>
  );
}
