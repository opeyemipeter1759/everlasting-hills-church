"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Hand } from "lucide-react";

export default function AnonymousInvitation() {
  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
      <div>
        <p className="text-white/75 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
          Members check in with a single tap. Track your attendance, build your streak,
          stay connected to the Hills family.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#87102C] font-bold text-sm hover:bg-amber-50 hover:-translate-y-0.5 hover:shadow-2xl transition-all"
          >
            Sign in to check in
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/first-timer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/25 text-white font-semibold text-sm hover:bg-white/8 hover:-translate-y-0.5 transition-all backdrop-blur-sm"
          >
            First time? Start here
          </Link>
        </div>
      </div>

      <div className="relative flex items-center justify-center py-8">
        <div className="relative">
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[#87102C]/45"
            animate={{ scale: [1, 1.9, 1], opacity: [0.45, 0, 0.45] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-[#a32242]/70 via-[#87102C]/70 to-[#5d091f]/70 border border-white/10 shadow-[0_20px_60px_rgba(135,16,44,0.45)] flex items-center justify-center"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Hand size={48} className="text-white/85" />
          </motion.div>
        </div>
        <p className="absolute -bottom-1 text-[10px] tracking-[0.25em] uppercase font-bold text-white/40">
          Members only · sign in to enable
        </p>
      </div>
    </div>
  );
}
