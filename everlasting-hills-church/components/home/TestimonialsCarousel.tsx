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
        <div className="flex -ml-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="pl-6 flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
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
              className="pointer-events-auto w-11 h-11 rounded-full bg-white dark:bg-[#1c1c1e] border border-[#E7CDD3] dark:border-white/10 shadow-[0_4px_20px_rgba(135,16,44,0.10)] flex items-center justify-center text-[#87102C] dark:text-gray-300 hover:bg-[#FFF4F6] hover:border-[#87102C]/40 dark:hover:bg-white/5 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Next testimonial"
              className="pointer-events-auto w-11 h-11 rounded-full bg-white dark:bg-[#1c1c1e] border border-[#E7CDD3] dark:border-white/10 shadow-[0_4px_20px_rgba(135,16,44,0.10)] flex items-center justify-center text-[#87102C] dark:text-gray-300 hover:bg-[#FFF4F6] hover:border-[#87102C]/40 dark:hover:bg-white/5 transition-colors"
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
                    : "w-2 bg-[#E7CDD3] dark:bg-white/20 hover:bg-[#d4a9b2] dark:hover:bg-white/30"
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
    <article className="group relative h-full flex flex-col gap-5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-[#E7CDD3]/60 dark:border-white/10 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#E7CDD3] hover:shadow-[0_8px_40px_rgba(135,16,44,0.10)]">
      {/* Decorative quote mark — brand accent, kept quiet */}
      <Quote
        className="text-[#87102C]/15 dark:text-[#e8768a]/25 flex-shrink-0"
        size={42}
        strokeWidth={1.5}
        aria-hidden="true"
      />

      <blockquote className="flex-1 text-[15px] leading-[1.75] text-[#444] dark:text-gray-300">
        {t.content}
      </blockquote>

      <div className="flex items-center gap-3 pt-5 border-t border-[#E7CDD3]/50 dark:border-white/8">
        {t.authorPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={t.authorPhotoUrl}
            alt=""
            className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-[#FFE8ED] dark:ring-white/10"
          />
        ) : (
          <span className="w-12 h-12 rounded-full bg-[#FFE8ED] dark:bg-[#87102C]/20 text-[#87102C] dark:text-[#e8768a] flex items-center justify-center text-sm font-bold flex-shrink-0">
            {initials(t.authorName)}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#111] dark:text-white truncate">
            {t.authorName}
          </p>
          {t.authorRole && (
            <p className="text-xs text-[#888] dark:text-gray-400 truncate">{t.authorRole}</p>
          )}
        </div>
      </div>
    </article>
  );
}
