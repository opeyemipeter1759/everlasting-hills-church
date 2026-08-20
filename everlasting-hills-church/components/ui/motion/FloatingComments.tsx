interface CommentBubble {
  text: string;
  top: string;
  left?: string;
  right?: string;
  duration: string;
  delay: string;
  drift: string;
}

// Fixed (non-random) placements — Math.random() here would render differently
// on the server vs. the client and trigger a hydration mismatch. Kept along the
// left/right edges so they never sit over the celebrant photos or CTA.
const COMMENTS: CommentBubble[] = [
  { text: "Happy birthday! 🎉", top: "8%", left: "1%", duration: "6s", delay: "0s", drift: "10px" },
  { text: "We love you! ❤️", top: "38%", left: "0%", duration: "7s", delay: "1.6s", drift: "-8px" },
  { text: "You are amazing! ✨", top: "66%", left: "2%", duration: "6.5s", delay: "3.2s", drift: "12px" },
  { text: "God bless you! 🙏", top: "14%", right: "1%", duration: "6.8s", delay: "0.9s", drift: "-10px" },
  { text: "Cheers to you! 🥂", top: "44%", right: "0%", duration: "7.2s", delay: "2.4s", drift: "9px" },
  { text: "So blessed to know you! 🎊", top: "72%", right: "2%", duration: "6.2s", delay: "3.8s", drift: "-11px" },
];

/**
 * Ambient "live comments" drifting along the edges — like reactions scrolling past on a
 * livestream. Pure CSS (see .comment-bubble / @keyframes comment-float in globals.css),
 * no state or hooks, so it's safe inside a server component. Hidden below md: at narrow
 * widths there's no edge room that doesn't collide with the centered content.
 */
export function FloatingComments({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 hidden overflow-hidden md:block ${className}`}>
      {COMMENTS.map((c, i) => (
        <span
          key={i}
          className="comment-bubble inline-flex items-center whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm"
          style={{
            top: c.top,
            left: c.left,
            right: c.right,
            animationDuration: c.duration,
            animationDelay: c.delay,
            ["--comment-drift" as string]: c.drift,
          }}
        >
          {c.text}
        </span>
      ))}
    </div>
  );
}
