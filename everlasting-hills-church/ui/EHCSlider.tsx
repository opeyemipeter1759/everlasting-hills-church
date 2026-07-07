"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";


export type EhcImage = {
  name: string;
  src?: string;
  gradient?: string;
};

export type EhcSliderProps = {
  images: EhcImage[];
  word?: string;
  cols?: number;
  rows?: number;
  holdMs?: number;
  wordHoldMs?: number;
  aspectRatio?: string;
  autoPlay?: boolean;
  className?: string;
};

type Target = { x: number; y: number };

const LETTERS: Record<string, string[]> = {
  E: ["#####", "#....", "####.", "#....", "#####"],
  H: ["#...#", "#...#", "#####", "#...#", "#...#"],
  C: [".####", "#....", "#....", "#....", ".####"],
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

   const textAssign = useMemo<Target[]>(() => {
    const targets = buildTextTargets(word);
    if (targets.length === 0) return homes;
    const arr: Target[] = [];
    for (let i = 0; i < N; i++) {
      const base = targets[i % targets.length];
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

  const naturalSizeCache = useRef<Map<string, { w: number; h: number }>>(new Map());

  const getNaturalSize = useCallback((src: string) => {
    return new Promise<{ w: number; h: number } | null>((resolve) => {
      const cached = naturalSizeCache.current.get(src);
      if (cached) return resolve(cached);
      const probe = new window.Image();
      probe.onload = () => {
        const size = { w: probe.naturalWidth, h: probe.naturalHeight };
        naturalSizeCache.current.set(src, size);
        resolve(size);
      };
      probe.onerror = () => resolve(null);
      probe.src = src;
    });
  }, []);

  // Sizes/positions each piece's background slice so the full image is scaled
  // uniformly to cover the stage (crop overflow) instead of being stretched
  // per-axis to match the stage's aspect ratio.
  const applyCoverSizing = useCallback((size: { w: number; h: number } | null) => {
    const stage = stageRef.current;
    if (!stage) return;
    const stageW = stage.clientWidth;
    const stageH = stage.clientHeight;
    const cellW = stageW / cols;
    const cellH = stageH / rows;

    let bgW = stageW;
    let bgH = stageH;
    let offX = 0;
    let offY = 0;

    if (size && size.w > 0 && size.h > 0) {
      const scale = Math.max(stageW / size.w, stageH / size.h);
      bgW = size.w * scale;
      bgH = size.h * scale;
      offX = (stageW - bgW) / 2;
      offY = (stageH - bgH) / 2;
    }

    pieceRefs.current.forEach((el, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      el.style.backgroundSize = `${bgW}px ${bgH}px`;
      el.style.backgroundPosition = `${offX - c * cellW}px ${offY - r * cellH}px`;
    });
  }, [cols, rows]);

  const paint = useCallback((i: number) => {
    const img = images[i];
    const value = img.src
      ? `url("${img.src}")`
      : (img.gradient ?? "none");
    pieceRefs.current.forEach((el) => {
      el.style.backgroundImage = value;
    });
    if (img.src) {
      getNaturalSize(img.src).then(applyCoverSizing);
    } else {
      applyCoverSizing(null);
    }
  }, [images, getNaturalSize, applyCoverSizing]);

  // Re-fit the current image's cover sizing when the stage is resized.
  useEffect(() => {
    const onResize = () => {
      const current = images[idxRef.current];
      const cached = current?.src ? naturalSizeCache.current.get(current.src) ?? null : null;
      applyCoverSizing(cached);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [images, applyCoverSizing]);

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
        {/* <div className="flex gap-2">
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
        </div> */}
      </div>
    </div>
  );
}

