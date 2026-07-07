"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { CarouselSlide } from "./types";

interface EditorialCardProps {
  slide: CarouselSlide;
  isActive: boolean;
  onClick: () => void;
  visibilityClassName?: string;
}

export default function EditorialCard({
  slide,
  isActive,
  onClick,
  visibilityClassName = "",
}: EditorialCardProps) {
  return (
    <motion.div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Life at EHC — slide ${slide.index}`}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick();
      }}
      whileHover={{ opacity: isActive ? 1 : 0.92 }}
      animate={{
        flexGrow: isActive ? 8 : 1,
        opacity: isActive ? 1 : 0.7,
        boxShadow: isActive
          ? "0 30px 80px -20px rgba(135,16,44,0.55)"
          : "0 10px 30px -18px rgba(0,0,0,0.6)",
      }}
      transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
      style={{ flexBasis: 0 }}
      className={`relative h-[300px] min-w-[64px] flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl ring-1 ring-white/10 sm:h-[400px] md:h-[480px] md:rounded-3xl ${visibilityClassName}`}
    >
      <motion.div
        animate={{
          scale: isActive ? 1.06 : 1,
          filter: isActive ? "brightness(1) saturate(1.1)" : "brightness(0.55) saturate(0.7)",
        }}
        transition={{ duration: 6, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <Image
          src={slide.image}
          alt={`Life at EHC — slide ${slide.index}`}
          fill
          sizes="(max-width: 768px) 80vw, 40vw"
          className="object-cover"
          priority={isActive}
        />
      </motion.div>

      <motion.div
        animate={{ opacity: isActive ? 0.8 : 0.6 }}
        className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

      <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold tracking-[0.25em] text-white/80 backdrop-blur-sm sm:top-5 sm:left-5 sm:px-2.5 sm:py-1 sm:text-xs md:top-7 md:left-7 md:text-sm">
        {slide.index}
      </span>

      <motion.div
        initial={false}
        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 24 }}
        transition={{ duration: 0.5, delay: isActive ? 0.15 : 0 }}
        className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-6 md:inset-x-8 md:bottom-8"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-church-accent sm:text-xs">
          Life at EHC
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-white/90 sm:mt-4 sm:text-xs">
          Learn More
          <ArrowRight size={14} />
        </span>
      </motion.div>
    </motion.div>
  );
}
