"use client";

interface ProgressBarProps {
  count: number;
  active: number;
  delay: number;
  paused: boolean;
  onSelect: (i: number) => void;
}

export default function ProgressBar({
  count,
  active,
  delay,
  paused,
  onSelect,
}: ProgressBarProps) {
  return (
    <div className="flex w-full items-center gap-3">
      {/* Compact mobile view: single active-slide timer + counter */}
      <div className="flex h-[3px] w-full overflow-hidden rounded-full bg-white/25 sm:hidden">
        <span
          key={`mobile-${active}`}
          className="progress-fill block h-full rounded-full bg-white"
          style={{
            animationDuration: `${delay}ms`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      </div>
      <span className="flex-shrink-0 text-xs font-bold tabular-nums text-white/60 sm:hidden">
        {String(active + 1).padStart(2, "0")}/{String(count).padStart(2, "0")}
      </span>

      {/* Full per-slide segmented view from sm breakpoint up */}
      <div className="hidden w-full gap-1.5 sm:flex">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25"
          >
            {i < active ? (
              <span className="block h-full w-full rounded-full bg-white" />
            ) : i === active ? (
              <span
                key={`active-${active}`}
                className="progress-fill block h-full rounded-full bg-white"
                style={{
                  animationDuration: `${delay}ms`,
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
            ) : (
              <span className="block h-full w-0 rounded-full bg-white" />
            )}
          </button>
        ))}
      </div>

      <style jsx>{`
        .progress-fill {
          width: 0%;
          animation-name: fill;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes fill {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
