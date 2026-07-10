"use client";

import { motion } from "framer-motion";

export function CosmicBackdrop() {
  const dots = [
    { top: "12%", left: "50%", size: 5, color: "#FFB3C1", delay: 0 },
    { top: "32%", left: "22%", size: 4, color: "#ffffff", delay: 0.8 },
    { top: "28%", left: "78%", size: 4, color: "#FFB3C1", delay: 1.6 },
    { top: "62%", left: "12%", size: 3, color: "#ffffff", delay: 0.4 },
    { top: "70%", left: "88%", size: 4, color: "#FFB3C1", delay: 1.1 },
    { top: "85%", left: "30%", size: 3, color: "#ffffff", delay: 0.6 },
    { top: "90%", left: "65%", size: 5, color: "#FFB3C1", delay: 1.9 },
  ];
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.10] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#87102C]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -right-16 w-72 h-72 rounded-full bg-amber-300/8 blur-3xl pointer-events-none" />
      {dots.map((d, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="absolute rounded-full pointer-events-none"
          style={{
            top: d.top, left: d.left,
            width: d.size, height: d.size,
            background: d.color,
            boxShadow: `0 0 ${d.size * 2.5}px ${d.color}`,
          }}
          animate={{ opacity: [0.25, 0.95, 0.25] }}
          transition={{ duration: 3.4, repeat: Infinity, delay: d.delay, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}
