"use client";

export default function VideoCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-[#1A2030] rounded-xl" />
      <div className="pt-3 space-y-2 px-0.5">
        <div className="h-3.5 bg-[#1A2030] rounded w-full" />
        <div className="h-3.5 bg-[#1A2030] rounded w-3/4" />
        <div className="h-3 bg-[#141C28] rounded w-1/2 mt-1" />
      </div>
    </div>
  );
}