"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * EhcSlider
 * ---------
 * An auto-playing image slider where the picture is split into a grid of
 * pieces. The pieces first gather into the letters "EHC", hold so the word
 * is readable, then flow outward into their real positions to form the
 * complete image. Before the next image, every piece slides back into the
 * letterforms, the image swaps behind them, and they spread out again.
 */

export type EhcImage = {
  /** Caption shown in the lower-left corner. */
  name: string;
  /**
   * Image URL — remote or from /public, e.g.
   *   "https://example.com/photo.jpg" or "/photos/aurora.jpg"
   */
  src?: string;
  /**
   * CSS gradient used instead of (or as a fallback for) `src`, e.g.
   *   "linear-gradient(135deg,#7F77DD,#1D9E75)"
   * One of `src` or `gradient` must be provided.
   */
  gradient?: string;
};

export type EhcSliderProps = {
  images: EhcImage[];
  /** The word the pieces spell out. Defaults to "EHC". */
  word?: string;
  /** Grid resolution. More = sharper letters but heavier. Default 16 x 10. */
  cols?: number;
  rows?: number;
  /** How long the finished image is shown, in ms. Default 2400. */
  holdMs?: number;
  /**
   * How long the EHC word stays on screen before flowing into the image, in ms.
   * Defaults to matching `holdMs` so the word and image hold equally long.
   */
  wordHoldMs?: number;
  /** Aspect ratio of the stage, e.g. "16 / 10". */
  aspectRatio?: string;
  /** Start playing automatically. Default true. */
  autoPlay?: boolean;
  className?: string;
};

type Target = { x: number; y: number };

const LETTERS: Record<string, string[]> = {
  E: ["#####", "#....", "####.", "#....", "#####"],
  H: ["#...#", "#...#", "#####", "#...#", "#...#"],
  C: [".####", "#....", "#....", "#....", ".####"],
  // A small fallback set so other words still render something sensible.
  A: [".###.", "#...#", "#####", "#...#", "#...#"],
  B: ["####.", "#...#", "####.", "#...#", "####."],
  D: ["####.", "#...#", "#...#", "#...#", "####."],
  L: ["#....", "#....", "#....", "#....", "#####"],
  O: [".###.", "#...#", "#...#", "#...#", ".###."],
  T: ["#####", "..#..", "..#..", "..#..", "..#.."],
};

const LW = 5;
const LH = 5;
const GAP = 3;

function buildTextTargets(word: string): Target[] {
  const letters = word
    .toUpperCase()
    .split("")
    .filter((ch) => LETTERS[ch]);
  if (letters.length === 0) return [];

  const totalW = letters.length * LW + (letters.length - 1) * GAP;
  const totalH = LH;
  const pts: { gx: number; gy: number }[] = [];

  let ox = 0;
  for (const ch of letters) {
    const grid = LETTERS[ch];
    for (let ry = 0; ry < LH; ry++) {
      for (let rx = 0; rx < LW; rx++) {
        if (grid[ry][rx] === "#") pts.push({ gx: ox + rx, gy: ry });
      }
    }
    ox += LW + GAP;
  }

  // Fit the word into a centered region of the stage.
  const scaleX = 0.78;
  const scaleY = 0.46;
  const offX = (1 - scaleX) / 2;
  const offY = 0.29;

  return pts.map((p) => ({
    x: offX + (p.gx / (totalW - 1)) * scaleX,
    y: offY + (p.gy / (totalH - 1)) * scaleY,
  }));
}

export default function EhcSlider({
  images,
  word = "EHC",
  cols = 16,
  rows = 10,
  holdMs = 2400,
  wordHoldMs,
  aspectRatio = "16 / 10",
  autoPlay = true,
  className = "",
}: EhcSliderProps) {
  const wordHold = wordHoldMs ?? holdMs;
  const stageRef = useRef<HTMLDivElement>(null);
  const pieceRefs = useRef<HTMLDivElement[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number[]>([]);

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);

  const idxRef = useRef(idx);
  const playingRef = useRef(playing);
  useEffect(() => void (idxRef.current = idx), [idx]);
  useEffect(() => void (playingRef.current = playing), [playing]);

  const N = cols * rows;

  // Each piece's resting "home" position (its slot in the finished image).
  const homes = useMemo<Target[]>(() => {
    const arr: Target[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        arr.push({ x: (c + 0.5) / cols, y: (r + 0.5) / rows });
      }
    }
    return arr;
  }, [cols, rows]);

  // Where each piece goes when forming the word. Every piece participates;
  // if there are more pieces than letter dots, dots get multiple pieces
  // (with a tiny offset) so the word looks dense and fully formed.
  const textAssign = useMemo<Target[]>(() => {
    const targets = buildTextTargets(word);
    if (targets.length === 0) return homes;
    const arr: Target[] = [];
    for (let i = 0; i < N; i++) {
      const base = targets[i % targets.length];
      // Pieces beyond the first pass on a dot get a small deterministic jitter
      // so they don't perfectly overlap — keeps the letter edges crisp/full.
      const pass = Math.floor(i / targets.length);
      const jx = pass === 0 ? 0 : ((((i * 31) % 7) - 3) / 3) * 0.006;
      const jy = pass === 0 ? 0 : ((((i * 17) % 7) - 3) / 3) * 0.006;
      arr.push({ x: base.x + jx, y: base.y + jy });
    }
    return arr;
  }, [word, N, homes]);

  const setPiece = useCallback((el: HTMLDivElement | null, i: number) => {
    if (el) pieceRefs.current[i] = el;
  }, []);

  const clearRafs = () => {
    rafRef.current.forEach((id) => cancelAnimationFrame(id));
    rafRef.current = [];
  };

  const applyHome = useCallback((immediate: boolean) => {
    pieceRefs.current.forEach((el, i) => {
      el.style.transition = immediate
        ? "none"
        : "transform 1200ms cubic-bezier(.2,.75,.2,1), opacity 600ms ease";
      el.style.transitionDelay = immediate ? "0ms" : `${(i % cols) * 14}ms`;
      el.style.transform = "translate3d(0,0,0) scale(1)";
      el.style.opacity = "1";
    });
  }, [cols]);

  const applyText = useCallback((immediate: boolean) => {
    const stage = stageRef.current;
    if (!stage) return;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    pieceRefs.current.forEach((el, i) => {
      const t = textAssign[i];
      const dx = (t.x - homes[i].x) * W;
      const dy = (t.y - homes[i].y) * H;
      el.style.transition = immediate
        ? "none"
        : "transform 1000ms cubic-bezier(.3,.7,.25,1), opacity 500ms ease";
      el.style.transitionDelay = immediate ? "0ms" : `${(i * 4) % 480}ms`;
      el.style.transform = `translate3d(${dx}px,${dy}px,40px) scale(0.9)`;
      el.style.opacity = "1";
    });
  }, [homes, textAssign]);

  const applyHidden = useCallback((immediate: boolean) => {
    pieceRefs.current.forEach((el, i) => {
      const ang = i * 53 * (Math.PI / 180);
      const dist = 320 + (i % 5) * 50;
      el.style.transition = immediate
        ? "none"
        : "transform 7000ms ease, opacity 600ms ease";
      el.style.transitionDelay = "0ms";
      el.style.transform = `translate3d(${Math.cos(ang) * dist}px,${
        Math.sin(ang) * dist
      }px,320px) scale(0.55)`;
      el.style.opacity = "0";
    });
  }, []);

  const paint = useCallback((i: number) => {
    const img = images[i];
    const value = img.src
      ? `url("${img.src}")`
      : (img.gradient ?? "none");
    pieceRefs.current.forEach((el) => {
      el.style.backgroundImage = value;
    });
  }, [images]);

  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => transitionTo(null), holdMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdMs]);

  // Word -> scatter -> swap image -> word -> image. Optionally jump to target.
  const transitionTo = useCallback((target: number | null) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearRafs();

    applyText(false); // gather current image back into the letters
    setTimeout(() => {
      applyHidden(false); // letters fly off
      setTimeout(() => {
        const next =
          target !== null ? target : (idxRef.current + 1) % images.length;
        setIdx(next);
        paint(next);
        applyText(true); // place new image's pieces as letters (no animation)
        const r1 = requestAnimationFrame(() => {
          const r2 = requestAnimationFrame(() => {
            applyText(false); // re-trigger so the word reads in
            // Let the word finish forming (~1000ms), then hold it on screen.
            setTimeout(() => {
              applyHome(false); // flow letters out into the full image
              if (playingRef.current) schedule();
            }, 1000 + wordHold);
          });
          rafRef.current.push(r2);
        });
        rafRef.current.push(r1);
      }, 650);
    }, 1000);
  }, [applyHidden, applyHome, applyText, images.length, paint, schedule, wordHold]);

  // Boot + cleanup.
  useEffect(() => {
    const start = setTimeout(() => {
      paint(idxRef.current);
      applyText(true);
      const r1 = requestAnimationFrame(() => {
        const r2 = requestAnimationFrame(() => {
          applyText(false);
          setTimeout(() => {
            applyHome(false);
            if (playingRef.current) schedule();
          }, 1000 + wordHold);
        });
        rafRef.current.push(r2);
      });
      rafRef.current.push(r1);
    }, 60);

    return () => {
      clearTimeout(start);
      if (timerRef.current) clearTimeout(timerRef.current);
      clearRafs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = () => {
    setPlaying((p) => {
      const next = !p;
      if (next) schedule();
      else if (timerRef.current) clearTimeout(timerRef.current);
      return next;
    });
  };

  const goTo = (i: number) => {
    if (i === idxRef.current) return;
    transitionTo(i);
  };

  return (
    <div className={`flex flex-col gap-3.5 ${className}`}>
      <div
        ref={stageRef}
        className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#0d0d12]"
        style={{ aspectRatio, perspective: "2000px" }}
      >
        <div
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {Array.from({ length: N }).map((_, i) => {
            const c = i % cols;
            const r = Math.floor(i / cols);
            return (
              <div
                key={i}
                ref={(el) => setPiece(el, i)}
                className="absolute will-change-transform"
                style={{
                  left: `${(c / cols) * 100}%`,
                  top: `${(r / rows) * 100}%`,
                  width: `${100 / cols}%`,
                  height: `${100 / rows}%`,
                  backgroundSize: `${cols * 100}% ${rows * 100}%`,
                  backgroundPosition: `${(c / (cols - 1)) * 100}% ${
                    (r / (rows - 1)) * 100
                  }%`,
                  backfaceVisibility: "hidden",
                }}
              />
            );
          })}
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3.5 z-[5] text-[15px] font-medium text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
          {images[idx]?.name}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to image ${i + 1}`}
              onClick={() => goTo(i)}
              className="h-2 w-2 rounded-full border-0 transition-all duration-200"
              style={{
                background: i === idx ? "#111827" : "#cbd5e1",
                transform: i === idx ? "scale(1.4)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

