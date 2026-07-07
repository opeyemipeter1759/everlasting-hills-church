"use client";

import Link from "next/link";
import { ChevronRight, Clock, MessageCircle, Youtube } from "lucide-react";
import { CHURCH } from "@/config/config";

export default function NoServiceHero() {
  return (
    <div className="flex flex-col items-center gap-7 py-10 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-white/8 border border-white/12 flex items-center justify-center backdrop-blur-sm">
        <Clock size={22} className="text-[#FFB3C1]" />
      </div>
      <div>
        <h3 className="text-white text-2xl sm:text-3xl font-bold mb-2 tracking-tight">
          No Service Today
        </h3>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed">
          No service is scheduled. Stay connected through our platforms.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <a
          href={CHURCH.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#87102C]/40 transition-all"
        >
          <Youtube size={15} fill="currentColor" />
          Watch on YouTube
          <ChevronRight size={14} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
        </a>
        <Link
          href="/prayer-request"
          className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/8 border border-white/15 text-white text-sm font-semibold backdrop-blur-sm hover:bg-white/15 hover:-translate-y-0.5 transition-all"
        >
          <MessageCircle size={15} />
          Prayer Wall
          <ChevronRight size={14} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
