import Link from "next/link";
import { Send, Youtube, Heart, Home, Users2 } from "lucide-react";
import { CHURCH } from "@/config/config";
import { useAutoScroll } from "./useAutoScroll";

export function QuickActionsStrip() {
  const scrollRef = useAutoScroll<HTMLDivElement>();
  const actions = [
    {
      icon: Send, label: "Submit Prayer", href: "/prayer-requests", external: false,
      cls: "bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-200/60 dark:border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-500/25",
      iconCls: "text-violet-600 dark:text-violet-400",
    },
    {
      icon: Youtube, label: "Watch Sermon", href: CHURCH.youtubeUrl, external: true,
      cls: "bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1] border-[#E7CDD3]/60 dark:border-[#87102C]/30 hover:bg-rose-100 dark:hover:bg-[#87102C]/35",
      iconCls: "text-[#87102C] dark:text-[#FFB3C1]",
    },
    {
      icon: Heart, label: "Give", href: "/give", external: false,
      cls: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/25",
      iconCls: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Home, label: "Join an Home Cell", href: "#", external: false,
      cls: "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/25",
      iconCls: "text-sky-600 dark:text-sky-400",
    },
    {
      icon: Users2, label: "Register for an Home Cell", href: "#", external: false,
      cls: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/25",
      iconCls: "text-amber-600 dark:text-amber-400",
    },

  ];

  const base = "flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all";

  return (
    <div ref={scrollRef} className="flex gap-2.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
      {actions.map((a) => {
        const Icon = a.icon;
        return a.external ? (
          <a key={a.label} href={a.href} target="_blank" rel="noopener noreferrer" className={`${base} ${a.cls}`}>
            <Icon size={13} className={a.iconCls} aria-hidden="true" />
            {a.label}
          </a>
        ) : (
          <Link key={a.label} href={a.href} className={`${base} ${a.cls}`}>
            <Icon size={13} className={a.iconCls} aria-hidden="true" />
            {a.label}
          </Link>
        );
      })}
    </div>
  );
}
