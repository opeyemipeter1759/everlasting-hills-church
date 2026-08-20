interface Piece {
  left: string;
  size: number;
  color: string;
  duration: string;
  delay: string;
  drift: string;
  round?: boolean;
}

// Fixed (non-random) piece list — Math.random() here would render a different
// layout on the server vs. the client and trigger a hydration mismatch.
const PIECES: Piece[] = [
  { left: "4%", size: 7, color: "#FFD84D", duration: "3.2s", delay: "0s", drift: "14px" },
  { left: "12%", size: 6, color: "#FF9ECF", duration: "2.8s", delay: "0.6s", drift: "-10px", round: true },
  { left: "20%", size: 8, color: "#8FE9DD", duration: "3.6s", delay: "1.1s", drift: "18px" },
  { left: "28%", size: 6, color: "#B491FF", duration: "3s", delay: "0.3s", drift: "-14px", round: true },
  { left: "36%", size: 7, color: "#FFD84D", duration: "3.4s", delay: "1.6s", drift: "10px" },
  { left: "44%", size: 6, color: "#FF9ECF", duration: "2.6s", delay: "0.9s", drift: "-16px", round: true },
  { left: "52%", size: 8, color: "#8FE9DD", duration: "3.1s", delay: "0.2s", drift: "12px" },
  { left: "60%", size: 6, color: "#B491FF", duration: "3.5s", delay: "1.3s", drift: "-8px", round: true },
  { left: "68%", size: 7, color: "#FFD84D", duration: "2.9s", delay: "0.7s", drift: "16px" },
  { left: "76%", size: 6, color: "#FF9ECF", duration: "3.3s", delay: "1.8s", drift: "-12px", round: true },
  { left: "84%", size: 8, color: "#8FE9DD", duration: "3s", delay: "0.4s", drift: "10px" },
  { left: "92%", size: 6, color: "#B491FF", duration: "2.7s", delay: "1s", drift: "-18px", round: true },
];

/**
 * Endless falling confetti — purely decorative CSS (see .confetti-piece / @keyframes
 * confetti-fall in globals.css). No state or hooks, so it's safe to drop into a server
 * component (BirthdayTeaserSection) as well as a client one (BirthdayCard).
 */
export function ConfettiFall({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {PIECES.map((p, i) => (
        <span
          key={i}
          className={`confetti-piece ${p.round ? "rounded-full" : "rounded-[1px]"}`}
          style={{
            left: p.left,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            backgroundColor: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
            ["--confetti-drift" as string]: p.drift,
          }}
        />
      ))}
    </div>
  );
}
