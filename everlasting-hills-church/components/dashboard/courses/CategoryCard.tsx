import Link from "next/link";
import { ArrowUpRight, Layers } from "lucide-react";
import { GRADIENT_PRESETS } from "@/lib/courses-data";

function gradientFor(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENT_PRESETS[hash % GRADIENT_PRESETS.length];
}

export default function CategoryCard({
  id,
  name,
  courseCount,
  subcategoryCount,
  href,
}: {
  id: string;
  name: string;
  courseCount: number;
  subcategoryCount?: number;
  href: string;
}) {
  const [from, to] = gradientFor(id);

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      <div
        className="relative flex h-24 items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        <div aria-hidden="true" className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <Layers size={32} className="relative text-white/85 transition-transform group-hover:scale-110" strokeWidth={1.5} />
        <span className="absolute right-3 top-3 flex h-7 w-7 -translate-y-1.5 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight size={14} />
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{name}</h3>
        <p className="mt-1 text-xs font-medium text-gray-400 dark:text-white/40">
          {courseCount} course{courseCount === 1 ? "" : "s"}
          {!!subcategoryCount && ` · ${subcategoryCount} subcategor${subcategoryCount === 1 ? "y" : "ies"}`}
        </p>
      </div>
    </Link>
  );
}
