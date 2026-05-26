"use client";

import type { ChangeEvent } from "react";
import { Search } from "lucide-react";

interface VideoSearchInputProps {
  value: string;
  onChange: (v: string) => void;
}

export default function VideoSearchInput({ value, onChange }: VideoSearchInputProps) {
  return (
    <div className="relative w-full sm:w-64">
      <label htmlFor="video-search" className="sr-only">Search videos</label>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-4 w-4 text-[#FFB3C1]" />
      </div>
      <input
        id="video-search"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder="Search by title"
        className="w-full rounded-lg bg-transparent border border-white/8 px-10 py-2 text-sm text-white/90 placeholder:text-white/50 focus:outline-none transition-colors duration-150"
      />
    </div>
  );
}
