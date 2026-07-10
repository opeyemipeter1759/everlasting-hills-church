import { getDailyScripture } from "./helpers";

export function ScriptureCard() {
  const scripture = getDailyScripture();
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(145deg, #16040f 0%, #280818 55%, #3a0c20 100%)" }}
    >
      {/* Dot grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      {/* Amber left accent rule */}
      <div className="absolute left-0 top-5 bottom-5 w-[3px] rounded-full bg-gradient-to-b from-amber-400/70 via-amber-300/40 to-transparent" />

      <div className="relative z-10 px-7 py-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300/60 mb-4">
          Scripture of the Day
        </p>
        <div className="flex gap-3 items-start">
          <span aria-hidden="true" className="text-5xl text-amber-400/30 font-serif leading-none flex-shrink-0 mt-0.5 select-none">
            &ldquo;
          </span>
          <div className="min-w-0">
            <p className="text-white/85 text-[15px] leading-[1.75] font-medium italic">
              {scripture.verse}
            </p>
            <p className="text-amber-300/60 text-[11px] font-bold uppercase tracking-[0.22em] mt-3.5">
              — {scripture.reference}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
