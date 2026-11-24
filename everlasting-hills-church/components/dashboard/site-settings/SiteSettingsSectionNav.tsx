import Link from "next/link";
import { ArrowUpRight, UserRound } from "lucide-react";
import type { SiteSectionName } from "@/lib/site-settings";
import { SECTION_META, SECTION_ORDER } from "./site-settings-sections";

export default function SiteSettingsSectionNav({
  active,
  onSelect,
}: {
  active: SiteSectionName;
  onSelect: (section: SiteSectionName) => void;
}) {
  return (
    <nav aria-label="Sections" className="w-56 flex-shrink-0 space-y-1">
      {SECTION_ORDER.map((section) => {
        const meta = SECTION_META[section];
        const TabIcon = meta.icon;
        const button = (
          <button
            key={section}
            type="button"
            onClick={() => onSelect(section)}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              section === active
                ? "bg-[#FFF4F6] text-[#87102C]"
                : "text-[#5A4A4D] hover:bg-[#FFF4F6]/70 hover:text-[#87102C]"
            }`}
          >
            <TabIcon size={15} className="flex-shrink-0" />
            {meta.label}
          </button>
        );
        if (section !== "HERO") return button;
        return (
          <div key={section} className="space-y-1">
            {button}
            <Link
              href="/dashboard/cms/pages/home"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[#5A4A4D] transition-colors hover:bg-[#FFF4F6]/70 hover:text-[#87102C]"
            >
              <UserRound size={15} className="flex-shrink-0" />
              Set Man
              <ArrowUpRight size={13} className="ml-auto flex-shrink-0 opacity-50" />
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
