"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface ControlsProps {
  onPrev: () => void;
  onNext: () => void;
}

export default function Controls({ onPrev, onNext }: ControlsProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-3">
      <button
        onClick={onPrev}
        aria-label="Previous slide"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white backdrop-blur-sm transition-all hover:scale-110 hover:border-church-accent/50 hover:bg-church-maroon/30 hover:text-church-accent md:h-12 md:w-12"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={onNext}
        aria-label="Next slide"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white backdrop-blur-sm transition-all hover:scale-110 hover:border-church-accent/50 hover:bg-church-maroon/30 hover:text-church-accent md:h-12 md:w-12"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
