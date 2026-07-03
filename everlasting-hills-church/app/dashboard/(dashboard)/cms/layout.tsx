"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Image as ImageIcon, ScrollText, PanelsTopLeft, Settings } from "lucide-react";

const NAV = [
  { label: "Pages", href: "/dashboard/cms", icon: FileText, exact: true },
  { label: "Site settings", href: "/dashboard/cms/settings", icon: Settings },
  { label: "Media library", href: "/dashboard/cms/media", icon: ImageIcon },
  { label: "Audit log", href: "/dashboard/cms/audit", icon: ScrollText },
];

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-[1500px]">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#87102C] text-white flex-shrink-0">
          <PanelsTopLeft size={20} />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
            Administration
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Public Site (CMS)
          </h1>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
            Edit every region of the public website. Changes are drafts until you publish.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left rail */}
        <nav className="lg:w-56 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] p-2">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? "bg-[#87102C] text-white"
                      : "text-gray-600 dark:text-white/60 hover:bg-[#FFF4F6] dark:hover:bg-white/5 hover:text-[#87102C] dark:hover:text-[#e8768a]"
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
