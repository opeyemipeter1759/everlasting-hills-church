"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChatCircle, CheckCircle, EnvelopeSimple, HandHeart, Icon } from "@/components/icons";

const EASE = [0.22, 1, 0.36, 1] as const;

const NEXT_STEPS = [
  {
    icon: EnvelopeSimple,
    title: "We've received it",
    body: "Your request has reached our welfare team. Nothing else is needed from you right now.",
  },
  {
    icon: ChatCircle,
    title: "Someone will reach out",
    body: "A member of the team will contact you directly, usually within a few days, to talk things through.",
  },
  {
    icon: HandHeart,
    title: "We'll walk with you",
    body: "Whatever we're able to do, we'll do with care and without judgment. You're not alone in this.",
  },
];

export default function WelfareSuccess() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col items-center px-5 py-10 text-center sm:px-10 sm:py-14"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <Icon icon={CheckCircle} size={32} />
      </span>

      <h2
        className="mt-6 text-3xl font-normal leading-tight text-[#2B1114] sm:text-4xl"
        style={{ fontFamily: "var(--wf-serif)" }}
      >
        Your request is in good hands.
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#6d565b]">
        Thank you for trusting us with this.
      </p>

      <div className="mt-10 w-full max-w-sm space-y-5 text-left">
        {NEXT_STEPS.map(({ icon: Glyph, title, body }) => (
          <div key={title} className="flex gap-3.5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#FFF4F6] text-[#87102C]">
              <Icon icon={Glyph} size={16} />
            </span>
            <div>
              <p className="text-sm font-bold text-[#2B1114]">{title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-[#6d565b]">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 w-full max-w-sm">
        <Link
          href="/"
          className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-[#E7CDD3] px-5 text-sm font-bold text-[#2B1114] transition-colors hover:bg-[#FFF8F6]"
        >
          Back to home
        </Link>
      </div>
    </motion.div>
  );
}
