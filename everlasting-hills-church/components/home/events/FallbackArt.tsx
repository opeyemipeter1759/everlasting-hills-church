/** Shown when an event has no flier (or it fails to load): branded gradient with the theme/title. */
export default function FallbackArt({ title }: { title?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(155deg, #1a0410 0%, #3a0818 35%, #87102C 75%, #a8163a 100%)" }}
      />
      <div
        className="absolute -right-1/4 -top-1/4 h-[70%] w-[70%] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, #FFB3C1 0%, transparent 70%)", filter: "blur(80px)" }}
      />
      {/* Fine diagonal texture */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 14px)" }}
      />
      <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
        {title ? (
          <p className="line-clamp-2 text-2xl font-black uppercase leading-tight tracking-[0.08em] text-white/85 drop-shadow">
            {title}
          </p>
        ) : (
          <p className="text-4xl font-black uppercase tracking-[0.2em] text-white/[0.08]">EHC</p>
        )}
      </div>
    </div>
  );
}
