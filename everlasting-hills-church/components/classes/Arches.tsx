/** The three arches of the church's stage backdrop, as a quiet SVG frame. No image to download. */
export default function Arches({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 220 120" fill="none" className={`pointer-events-none ${className}`}>
      <path d="M10 120V60a50 50 0 0 1 100 0v60" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1.5" />
      <path d="M60 120V60a50 50 0 0 1 100 0v60" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1.5" />
      <path d="M110 120V60a50 50 0 0 1 100 0v60" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1.5" />
    </svg>
  );
}
