"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useMe } from "@/lib/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { isBirthdayToday } from "@/lib/birthday";

const PALETTE = ["#87102C", "#E8B44A", "#FFB3C1", "#3B82F6", "#22C55E", "#A855F7", "#F97316", "#EF4444"];
const BALLOON_COUNT = 14;
const BUBBLE_COUNT = 18;
const BURST_ANGLES = Array.from({ length: 8 }, (_, index) => (index / 8) * Math.PI * 2);

type Floater = { id: number; left: number; size: number; delay: number; duration: number; sway: number; color: string };

function makeFloaters(
  count: number,
  [minSize, maxSize]: [number, number],
  [minDuration, maxDuration]: [number, number],
  maxDelay: number,
): Floater[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: (id / count) * 92 + Math.random() * 6,
    size: minSize + Math.random() * (maxSize - minSize),
    delay: Math.random() * maxDelay,
    duration: minDuration + Math.random() * (maxDuration - minDuration),
    sway: 10 + Math.random() * 22,
    color: PALETTE[id % PALETTE.length],
  }));
}

function BalloonShape({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size * 1.55} viewBox="0 0 40 62" aria-hidden="true">
      <path d="M20 2C9.5 2 2 10.6 2 21.5 2 33 11 42 20 44c9-2 18-11 18-22.5C38 10.6 30.5 2 20 2z" fill={color} />
      <ellipse cx="13" cy="14" rx="4" ry="7" fill="#ffffff" opacity="0.35" transform="rotate(-20 13 14)" />
      <path d="M17.5 44l2.5 4 2.5-4z" fill={color} />
      <path d="M20 48c-3 4 3 7 0 11" stroke="#9CA3AF" strokeWidth="1" fill="none" />
    </svg>
  );
}

function Burst({ color }: { color: string }) {
  return (
    <>
      {BURST_ANGLES.map((angle) => (
        <motion.span
          key={angle}
          aria-hidden="true"
          className="absolute left-1/2 top-1/3 h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: Math.cos(angle) * 34, y: Math.sin(angle) * 34, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      ))}
    </>
  );
}


export default function BirthdayCelebration() {
  const user = useCurrentUser();
  const { data: me } = useMe({ enabled: Boolean(user?.loggedIn) });
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const thanksRef = useRef<HTMLButtonElement>(null);
  const member = me?.member;
  const [open, setOpen] = useState(false);
  const [popped, setPopped] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!member?.id || !isBirthdayToday(member.dateOfBirth)) return;
    // No "seen today" memory on purpose: the celebration greets them on every
    // visit and every refresh for as long as it's their birthday. Closing it
    // only clears it from the page they're on.
    setOpen(true);
  }, [member?.id, member?.dateOfBirth]);

  useEffect(() => {
    if (!open) return;
    thanksRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const balloons = useMemo(() => (open ? makeFloaters(BALLOON_COUNT, [46, 70], [9, 14], 3) : []), [open]);
  const bubbles = useMemo(() => (open ? makeFloaters(BUBBLE_COUNT, [18, 46], [7, 12], 4) : []), [open]);
  const pop = (key: string) => setPopped((previous) => new Set(previous).add(key));
  const firstName = member?.firstName?.trim() || "friend";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="birthday-celebration"
          className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {!reduceMotion &&
            bubbles.map((bubble) => {
              const key = `bubble-${bubble.id}`;
              const isPopped = popped.has(key);
              return (
                <motion.button
                  key={key}
                  type="button"
                  tabIndex={-1}
                  aria-label="Pop bubble"
                  data-popped={isPopped || undefined}
                  disabled={isPopped}
                  onClick={() => pop(key)}
                  className="pointer-events-auto absolute -bottom-16 rounded-full border border-sky-300/70 bg-gradient-to-br from-white/80 via-sky-100/50 to-pink-200/50 shadow-[inset_-3px_-5px_10px_rgba(255,255,255,0.7),0_2px_10px_rgba(59,130,246,0.18)] dark:border-white/40 dark:from-white/40 dark:via-sky-100/10 dark:to-pink-200/20 dark:shadow-[inset_-3px_-5px_10px_rgba(255,255,255,0.35)]"
                  style={{ left: `${bubble.left}%`, width: bubble.size, height: bubble.size }}
                  initial={{ y: 0, opacity: 0 }}
                  animate={
                    isPopped
                      ? { scale: 1.6, opacity: 0 }
                      : { y: "-115vh", x: [0, bubble.sway, -bubble.sway, 0], opacity: [0, 0.9, 0.9, 0.6] }
                  }
                  transition={
                    isPopped
                      ? { duration: 0.2 }
                      : {
                          duration: bubble.duration,
                          delay: bubble.delay,
                          ease: "linear",
                          x: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                        }
                  }
                />
              );
            })}

          {!reduceMotion &&
            balloons.map((balloon) => {
              const key = `balloon-${balloon.id}`;
              const isPopped = popped.has(key);
              return (
                <motion.button
                  key={key}
                  type="button"
                  tabIndex={-1}
                  aria-label="Pop balloon"
                  data-popped={isPopped || undefined}
                  disabled={isPopped}
                  onClick={() => pop(key)}
                  className="pointer-events-auto absolute -bottom-32 origin-bottom"
                  style={{ left: `${balloon.left}%` }}
                  initial={{ y: 0 }}
                  animate={{ y: "-125vh", rotate: [-4, 4, -4] }}
                  transition={{
                    duration: balloon.duration,
                    delay: balloon.delay,
                    ease: "easeOut",
                    rotate: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
                  }}
                >
                  <motion.span
                    className="block"
                    animate={isPopped ? { scale: [1, 1.25, 0], opacity: [1, 1, 0] } : { scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    <BalloonShape color={balloon.color} size={balloon.size} />
                  </motion.span>
                  {isPopped && <Burst color={balloon.color} />}
                </motion.button>
              );
            })}

          <div className="absolute inset-x-0 top-20 flex justify-center px-4">
            <motion.div
              role="dialog"
              aria-modal="false"
              aria-labelledby={titleId}
              className="pointer-events-auto relative w-full max-w-sm rounded-3xl bg-white/95 p-6 text-center shadow-2xl ring-1 ring-[#E7CDD3] backdrop-blur dark:bg-[#1a0b10]/95 dark:ring-white/10"
              initial={{ y: -16, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close birthday celebration"
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={16} aria-hidden="true" />
              </button>
              <p className="text-4xl" aria-hidden="true">🎂</p>
              <h2 id={titleId} className="mt-2 font-serif text-2xl font-bold text-[#87102C] dark:text-[#FFB3C1]">
                Happy birthday, {firstName}!
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/70">
                Everyone at Everlasting Hills is celebrating you today.
              </p>
              <p className="mt-3 font-serif text-sm italic text-gray-700 dark:text-white/80">
                “The Lord bless you and keep you.”
                <span className="mt-0.5 block text-xs not-italic text-gray-500 dark:text-white/50">Numbers 6:24</span>
              </p>
              {reduceMotion ? (
                <p className="mt-3 text-2xl" aria-hidden="true">🎈🎉🎈</p>
              ) : (
                <p className="mt-3 text-xs font-semibold text-gray-500 dark:text-white/55">Tap the balloons to pop them 🎈</p>
              )}
              <button
                ref={thanksRef}
                type="button"
                onClick={() => setOpen(false)}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#87102C] px-6 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24]"
              >
                Thank you!
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
