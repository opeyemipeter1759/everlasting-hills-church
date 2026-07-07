"use client";

import { useRef } from "react";
import { Sparkles } from "lucide-react";
import ScrollReveal from "../ScrollReveal";
import EditorialCard from "./EditorialCard";
import Controls from "./Controls";
import ProgressBar from "./ProgressBar";
import { useCarousel } from "./useCarousel";
import { getVisibleWindow } from "./getVisibleWindow";
import type { CarouselSlide } from "./types";

interface EditorialCarouselProps {
  items: CarouselSlide[];
  autoPlay?: boolean;
  delay?: number;
}

export default function EditorialCarousel({
  items,
  autoPlay = true,
  delay = 5000,
}: EditorialCarouselProps) {
  const { active, goTo, next, prev, paused, setPaused } = useCarousel({
    length: items.length,
    delay,
    autoPlay,
  });
  const dragStartX = useRef<number | null>(null);
  const visible = getVisibleWindow(active, items.length, 2);

  function onPointerDown(e: React.PointerEvent) {
    dragStartX.current = e.clientX;
    setPaused(true);
  }

  function onPointerUp(e: React.PointerEvent) {
    setPaused(false);
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > 60) (delta < 0 ? next : prev)();
    dragStartX.current = null;
  }

  return (
    <section className="relative overflow-hidden bg-church-dark py-24 md:py-32">
      <div className="pointer-events-none absolute -top-32 left-[-10%] h-96 w-96 rounded-full bg-church-maroon/30 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-15%] right-[-10%] h-[28rem] w-[28rem] rounded-full bg-church-accent/10 blur-[160px]" />
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-50 mix-blend-overlay" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <ScrollReveal>
          <div className="flex flex-col items-start text-start">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-church-accent">
              <Sparkles size={13} />
              Life at EHC
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Moments worth showing up for.
            </h2>
          </div>
        </ScrollReveal>

        <div
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          className="mt-10 flex touch-pan-y select-none gap-2 md:mt-12 md:gap-3"
        >
          {visible.map(({ index, offset }) => (
            <EditorialCard
              key={items[index].id}
              slide={items[index]}
              isActive={offset === 0}
              onClick={() => goTo(index)}
              visibilityClassName={
                offset === 0 ? "" : Math.abs(offset) === 1 ? "hidden sm:block" : "hidden lg:block"
              }
            />
          ))}
        </div>

        <div className="mt-6 flex items-center gap-4 md:mt-8 md:gap-6">
          <ProgressBar
            count={items.length}
            active={active}
            delay={delay}
            paused={paused}
            onSelect={goTo}
          />
          <Controls onPrev={prev} onNext={next} />
        </div>
      </div>
    </section>
  );
}
