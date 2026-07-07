"use client";

import { motion } from "framer-motion";

export default function CosmicBackdrop() {
  const dots = [
    { top: "8%", left: "22%", size: 4, color: "#FFB3C1", delay: 0 },
    { top: "16%", left: "78%", size: 5, color: "#ffffff", delay: 0.6 },
    { top: "28%", left: "12%", size: 3, color: "#FFB3C1", delay: 1.2 },
    { top: "34%", left: "88%", size: 4, color: "#FFB3C1", delay: 0.4 },
    { top: "48%", left: "6%", size: 5, color: "#ffffff", delay: 1.6 },
    { top: "55%", left: "94%", size: 3, color: "#FFB3C1", delay: 0.9 },
    { top: "68%", left: "20%", size: 4, color: "#ffffff", delay: 0.2 },
    { top: "72%", left: "82%", size: 5, color: "#FFB3C1", delay: 1.4 },
    { top: "84%", left: "10%", size: 3, color: "#FFB3C1", delay: 0.7 },
    { top: "88%", left: "55%", size: 4, color: "#ffffff", delay: 1.1 },
    { top: "92%", left: "90%", size: 3, color: "#FFB3C1", delay: 0.3 },
  ];
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-[#87102C]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-amber-300/8 blur-3xl pointer-events-none" />
      {dots.map((d, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="absolute rounded-full pointer-events-none"
          style={{
            top: d.top,
            left: d.left,
            width: d.size,
            height: d.size,
            background: d.color,
            boxShadow: `0 0 ${d.size * 2.5}px ${d.color}`,
          }}
          animate={{ opacity: [0.2, 0.95, 0.2] }}
          transition={{ duration: 3.6, repeat: Infinity, delay: d.delay, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}
