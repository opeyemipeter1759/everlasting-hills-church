"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";



const IMAGES = [
  "/images/church_congregation_1_1779193592146.png",
  "/images/church_congregation_2_1779193607195.png",
  "/images/church_congregation_3_1779193624434.png",
  "/images/church_congregation_4_1779193639860.png",
   "/images/church_congregation_3_1779193624434.png",
  "/images/church_congregation_4_1779193639860.png",
];

export default function HeroSection() {
  const rootRef = useRef<HTMLElement | null>(null);

  return (
    <section
      id="hero"
      ref={rootRef}
      onMouseMove={(e) => {
        const el = rootRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
        const y = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
        el.style.setProperty("--mx", String(x));
        el.style.setProperty("--my", String(y));
      }}
      className="relative flex-1  flex flex-col  h-[100vh] justify-center overflow-hidden pt-24 lg:pt-28"
    >
      {/* Background Gradients & Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[60%] bg-church-maroon opacity-20 blur-[120px] rounded-full group-hover:opacity-30 transition-opacity duration-1000"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[50%] bg-[#4a0819] opacity-30 blur-[100px] rounded-full group-hover:opacity-40 transition-opacity duration-1000"></div>
        <div className="absolute inset-0 bg-grid-white" />
          {/* background particles (very obvious) - placed above grid but behind content (content is z-10) 
          <ParticleCanvas density={2} speed={2} className="opacity-50 filter saturate-100 z-0 pointer-events-none" />
          */}
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto  w-full px-6 lg:px-12 py-12 lg:py-0">
        <div className="grid grid-cols-1 md:grid-cols-12 lg:gap-8 items-center mb-20">
          {/* Left Content */}
          <div className="md:col-span-12 lg:col-span-7 flex flex-col items-start justify-center  text-left mb-16 lg:mb-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-church-maroon/30 border border-church-maroon/50 mb-4"
            >
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-black text-church-accent">
                Genesis 49:22–26
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-[48px] sm:text-[64px] text-white lg:text-[84px] leading-[0.95] font-bold font-display tracking-tight mb-5"
            >
              The warmth of home <br/>
              <motion.span
                className="text-transparent bg-clip-text bg-gradient-to-r from-church-accent to-church-maroon font-serif italic font-normal"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% 100%" }}
              >
                before you arrive.
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/60 text-lg sm:text-xl max-w-xl leading-relaxed mb-5 font-sans font-medium"
            >
              Experience joyful worship and a peaceful place where hearts are heard. 
              A community rooted in the Word and alive in the Spirit.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-4 bg-white text-church-dark font-bold rounded-xl hover:bg-church-warm transition-all flex items-center justify-center gap-3 shadow-2xl shadow-white/10"
              >
                Plan Your Visit
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-4 bg-transparent border border-white/20 font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-white"
              >
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <Play className="w-3 h-3 fill-white" />
                </div>
                Watch Service
              </motion.button>
            </motion.div>
          </div>

          {/* Right Visual (Interactive Media) */}
          <div className="md:col-span-12 lg:col-span-5 relative   flex items-center justify-center">
            <div className="relative w-full aspect-[3.5/5] md:aspect-[4.7/5] max-w-xl bg-church-card rounded-[40px] border border-white/10 p-6 shadow-2xl overflow-hidden group transition-all duration-500 hover:border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-church-maroon/20 to-transparent pointer-events-none"></div>
              
              {/* Photo Fan Integration - Scaled and Positioned */}
              <div className="absolute  inset-0 z-10 flex items-center justify-center scale-[1] lg:scale-[1] translate-y-[-10%] sm:translate-y-0">
                <ParticleCanvas />
                <div
                  className="relative z-10 w-full h-full flex items-center justify-center"
                  style={{
                    transform: "translate3d(calc(var(--mx, 0) * 18px), calc(var(--my, 0) * 8px), 0)",
                    transition: "transform 0.08s linear",
                  }}
                >
                  <PhotoFan images={IMAGES} />
                </div>
              </div>

              {/* Decorative Graphics (Design Elements from HTML) */}
              <div className="relative h-full flex  flex-col justify-between z-20 pointer-events-none">
                <div className="space-y-4">
                  <div className="h-1.5 w-16 bg-church-accent rounded-full transition-all group-hover:w-24"></div>
                  <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-bold">Weekly Gathering</p>
                </div>

                <div className="flex flex-col md:mb-0 mb-16 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl"
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-church-accent">
                        <Play className="w-5 h-5 fill-church-accent" />
                      </div>
                      <span className="font-bold text-white tracking-tight text-sm">Join the Rhythm</span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed uppercase tracking-wider font-semibold">
                      Experience the pulse of praise.
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Mountain Illustration (Design element from HTML) */}
              <div className="absolute bottom-[-10px] left-0 w-full pointer-events-none">
                <svg viewBox="0 0 400 150" className="w-full opacity-10 transition-opacity group-hover:opacity-20">
                  <path d="M0 150 L80 60 L140 100 L240 20 L320 90 L400 40 L400 150 Z" fill="white" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function PhotoFan({ images }: { images: string[] }) {
  return (
    <div className="relative w-full max-w-xl h-full flex justify-center items-center">
      {images.map((img, i) => {
        const rotationRange = 8;
        const rotation = (i - (images.length - 1) / 2) * rotationRange;
        const xOffset = `calc(${(i - (images.length - 1) / 2)} * 68px)`;
        const zIndex = i === Math.floor(images.length / 2) ? 20 : 10;

        return (
          <motion.div
            key={img}
            initial={{ opacity: 0, scale: 0.7, y: 40, rotate: rotation * 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              rotate: rotation,
              x: xOffset,
              zIndex,
            }}
            whileHover={{
              zIndex: 50,
              y: -20,
              scale: 1.05,
              rotate: rotation * 0.5,
              transition: { duration: 0.25 },
            }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 16,
              delay: 0.35 + i * 0.12,
            }}
            style={{ zIndex }}
            className="absolute mt-16 md:mt-0 rounded-2xl p-1.5 sm:p-2 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden cursor-pointer w-[160px] h-[250px] sm:w-[200px] sm:h-[260px] lg:w-[240px] lg:h-[280px]"
          >
            <div className="relative w-full h-full rounded-xl overflow-hidden group/image">
              <img
                src={img}
                alt="Church Community"
                className="w-full h-full object-cover grayscale-[0.2] group-hover/image:grayscale-0 transition-all duration-500"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-church-dark/40 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function ParticleCanvas({
  density = 1,
  speed = 1,
  className = "",
}: {
  density?: number;
  speed?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas as HTMLCanvasElement;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const context = ctx as CanvasRenderingContext2D;

    let particles: Array<{ x: number; y: number; r: number; vx: number; vy: number; a: number }> = [];
    const DPR = window.devicePixelRatio || 1;

    function resize() {
      c.width = Math.max(300, c.clientWidth) * DPR;
      c.height = Math.max(300, c.clientHeight) * DPR;
      context.scale(DPR, DPR);
    }

    function init() {
      particles = [];
      const divisor = Math.max(2000, 8000 / Math.max(0.1, density));
      const count = Math.round((c.clientWidth * c.clientHeight) / divisor);
      for (let i = 0; i < Math.max(8, count); i++) {
        particles.push({
          x: Math.random() * c.clientWidth,
          y: Math.random() * c.clientHeight,
          r: 0.5 + Math.random() * (1.8 * Math.max(0.5, density)),
          vx: (Math.random() - 0.5) * 0.15 * Math.max(0.25, speed),
          vy: (-0.02 - Math.random() * 0.18) * Math.max(0.35, speed),
          a: 0.04 + Math.random() * 0.12 * Math.max(0.5, density),
        });
      }
    }

    let raf = 0;

    function draw() {
      if (!context) return;
      context.clearRect(0, 0, c.width, c.height);
      context.save();
      context.globalCompositeOperation = "lighter";
      for (const p of particles) {
        context.beginPath();
        context.fillStyle = `rgba(255,255,255,${p.a})`;
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }

    function step() {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) p.y = c.clientHeight + 10;
        if (p.x < -10) p.x = c.clientWidth + 10;
        if (p.x > c.clientWidth + 10) p.x = -10;
      }
      draw();
      raf = requestAnimationFrame(step);
    }

    resize();
    init();
    raf = requestAnimationFrame(step);

    const onResize = () => {
      resize();
      init();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className={"absolute inset-0 w-full h-full z-0 pointer-events-none " + className} />;
}


// export default function HeroSection() {
//   return (
//     <section
//       id="hero"
//       className="relative min-h-screen flex flex-col justify-center overflow-hidden"
//       style={{
//         background:
//           "linear-gradient(155deg, #87102C 0%, #6E0C24 40%, #4a0819 70%, #2a0410 100%)",
//       }}
//     >
//       {/* ── Background texture layers ── */}
//       <div
//         className="absolute inset-0 opacity-[0.04]"
//         style={{
//           backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
//         }}
//       />

//       {/* Mountains illustration at bottom */}
//       <div className="absolute inset-x-0 bottom-0 pointer-events-none">
//         <MountainRange />
//       </div>

//       {/* Soft radial glow */}
//       <div
//         className="absolute inset-0 pointer-events-none"
//         style={{
//           background:
//             "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.06) 0%, transparent 65%)",
//         }}
//       />

//       {/* Content */}
//       <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-32">
//         <div className="max-w-3xl mx-auto text-center">
//           {/* Scripture reference badge */}
//           <motion.div
//             initial={{ opacity: 0, y: 12 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, delay: 0.2 }}
//             className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/8 backdrop-blur-sm mb-8"
//           >
//             <span className="w-1.5 h-1.5 rounded-full bg-[#FFE8ED]" />
//             <span className="text-white/70 text-xs tracking-[0.12em] uppercase font-medium">
//               {/* ── Bible reference shown in the badge ── */}
//               Rooted in Genesis 49:22–26
//             </span>
//           </motion.div>

//           {/* Church name */}
//           <motion.p
//             initial={{ opacity: 0, y: 16 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, delay: 0.35 }}
//             className="text-white/60 text-sm sm:text-base tracking-[0.25em] uppercase font-medium mb-4"
//           >
//             Everlasting Hills Church
//           </motion.p>

//           {/* Main headline */}
//           <motion.h1
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.7, delay: 0.5 }}
//             className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-6 text-balance"
//           >
//             {/* ── Main headline — edit freely ── */}
//             Raising men who flourish{" "}
//             <em className="not-italic text-[#FFB3C1]">beyond limits</em>
//           </motion.h1>

//           {/* Subtext */}
//           <motion.p
//             initial={{ opacity: 0, y: 16 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, delay: 0.65 }}
//             className="text-white/65 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto"
//           >
//             {/* ── Subtext — edit freely ── */}
//             A Word-centered, Spirit-filled, and community-focused church in
//             Ibadan, Nigeria.
//           </motion.p>

//           {/* CTA Buttons */}
//           <motion.div
//             initial={{ opacity: 0, y: 14 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, delay: 0.8 }}
//             className="flex flex-col sm:flex-row items-center justify-center gap-3"
//           >
//             {/* ── Primary CTA ── */}
//             <a
//               href="#services"
//               className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white text-[#87102C] text-sm font-semibold hover:bg-[#FFE8ED] transition-all duration-200 hover:shadow-xl hover:shadow-white/20 hover:-translate-y-0.5 w-full sm:w-auto justify-center"
//             >
//               Join Us This Sunday
//               <ArrowRight
//                 size={16}
//                 className="group-hover:translate-x-1 transition-transform"
//               />
//             </a>

//             {/* ── Secondary CTA ── */}
//             <a
//               href="#sermons"
//               className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-all duration-200 w-full sm:w-auto justify-center"
//             >
//               <span className="flex items-center justify-center w-6 h-6 rounded-full border border-white/40 group-hover:border-white/70 transition-colors">
//                 <Play size={10} fill="white" />
//               </span>
//               Watch Sermons
//             </a>
//           </motion.div>

//           {/* Divider line + pillars */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.8, delay: 1 }}
//             className="mt-16 flex items-center justify-center gap-0"
//           >
//             {["Word", "Spirit", "Community"].map((pillar, i) => (
//               <span key={pillar} className="flex items-center">
//                 <span className="text-white/40 text-xs tracking-[0.2em] uppercase font-medium px-4">
//                   {pillar}
//                 </span>
//                 {i < 2 && (
//                   <span className="w-px h-3 bg-white/20 mx-0 flex-shrink-0" />
//                 )}
//               </span>
//             ))}
//           </motion.div>
//         </div>
//       </div>

//       {/* Scroll indicator */}
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ delay: 1.4, duration: 0.6 }}
//         className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
//       >
//         <span className="text-white/30 text-[10px] tracking-widest uppercase">
//           Scroll
//         </span>
//         <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
//       </motion.div>
//     </section>
//   );
// }

// // Layered mountain range SVG illustration
// function MountainRange() {
//   return (
//     <svg
//       viewBox="0 0 1440 220"
//       xmlns="http://www.w3.org/2000/svg"
//       preserveAspectRatio="none"
//       className="w-full"
//       aria-hidden="true"
//     >
//       {/* Back mountains */}
//       <path
//         d="M0,160 L180,60 L360,130 L540,40 L720,110 L900,50 L1080,120 L1260,55 L1440,140 L1440,220 L0,220 Z"
//         fill="rgba(255,255,255,0.03)"
//       />
//       {/* Mid mountains */}
//       <path
//         d="M0,180 L200,90 L400,155 L600,70 L800,140 L1000,75 L1200,145 L1440,80 L1440,220 L0,220 Z"
//         fill="rgba(255,255,255,0.04)"
//       />
//       {/* Front hills / ground transition */}
//       <path
//         d="M0,200 L240,140 L480,190 L720,130 L960,185 L1200,135 L1440,175 L1440,220 L0,220 Z"
//         fill="rgba(255,232,237,0.06)"
//       />
//       {/* Ground — blends into next section */}
//       <path
//         d="M0,215 L1440,215 L1440,220 L0,220 Z"
//         fill="rgba(255,255,255,0.05)"
//       />
//     </svg>
//   );
// }