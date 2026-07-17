import { ArrowRight } from "lucide-react";
import { extractHandle, type SocialPlatform } from "./social-platforms";

export function SocialCard({
  platform,
  value,
}: {
  platform: SocialPlatform;
  value: string | null;
}) {
  const { label, Icon, brandColor, buildUrl } = platform;
  const connected = !!value;
  const fullUrl = connected ? buildUrl(value!) : null;

  const inner = (
    <div
      className={`group flex items-center gap-4 p-4 sm:p-5 rounded-2xl border h-full transition-all duration-300
        ${
          connected
            ? "bg-white dark:bg-white/[0.05] border-[#E7CDD3]/60 dark:border-white/[0.09] hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] dark:hover:shadow-[0_8px_40px_rgba(255,255,255,0.03)] hover:-translate-y-0.5"
            : "bg-[#FFF4F6] dark:bg-white/[0.03] border-[#E7CDD3]/40 dark:border-white/[0.06] opacity-60"
        }`}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: connected ? `${brandColor}1A` : "#FFE8ED" }}
      >
        <Icon size={18} aria-hidden="true" style={{ color: connected ? brandColor : "#c9b0b5" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#8a7e80] dark:text-white/40 mb-1">
          {label}
        </p>
        {connected ? (
          <>
            <p className="text-sm font-bold text-[#111] dark:text-white truncate leading-snug">
              {extractHandle(value!)}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1] mt-1
              group-hover:gap-1.5 transition-all">
              View profile
              <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </span>
          </>
        ) : (
          <p className="text-sm italic font-normal text-[#b8a8ac] dark:text-white/30 leading-tight">
            Not connected
          </p>
        )}
      </div>
    </div>
  );

  if (!connected) return inner;

  return (
    <a
      href={fullUrl!}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label}: ${extractHandle(value!)}`}
      className="block"
    >
      {inner}
    </a>
  );
}
