"use client";

export default function VideoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.22)] animate-pulse">
      <div className="aspect-[16/10] rounded-[22px] bg-gradient-to-br from-[#2a1015] via-[#17080c] to-[#0d0d0d]" />
      <div className="space-y-3 pt-4">
        <div className="h-4 w-5/6 rounded-full bg-white/8" />
        <div className="h-3 w-2/3 rounded-full bg-white/8" />
        <div className="flex gap-2 pt-1">
          <div className="h-7 w-14 rounded-full bg-white/8" />
          <div className="h-7 w-14 rounded-full bg-white/8" />
          <div className="h-7 w-14 rounded-full bg-white/8" />
        </div>
      </div>
    </div>
  );
}