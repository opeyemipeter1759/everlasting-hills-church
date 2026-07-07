export default function FallbackArt() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(155deg, #1a0410 0%, #3a0818 35%, #87102C 75%, #a8163a 100%)" }}
      />
      <div
        className="absolute -top-1/4 -right-1/4 h-[70%] w-[70%] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, #FFB3C1 0%, transparent 70%)", filter: "blur(80px)" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-4xl font-black uppercase tracking-[0.2em] text-white/[0.08]">EHC</p>
      </div>
    </div>
  );
}
