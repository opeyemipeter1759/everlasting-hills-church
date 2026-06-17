import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import KebabMenu from "./KebabMenu";

/** Kebab chrome shared by every dashboard card so they forward it uniformly. */
export interface DashboardCardChrome {
  /** "View More" target in the kebab menu. */
  viewMoreHref?: string;
  /** Called when the card's kebab "Delete" is chosen (dismiss). */
  onDismiss?: () => void;
}

/**
 * Shared elevated card for the admin dashboard — matches the house SectionCard style
 * (white / dark surface, rose border, brand kicker). Optional header with icon chip,
 * kicker, title and a right-aligned action slot.
 */
export default function DashboardCard({
  kicker,
  title,
  icon: Icon,
  action,
  viewMoreHref,
  onDismiss,
  bodyClassName = "p-5 sm:p-6",
  className = "",
  children,
}: {
  kicker?: string;
  title?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  /** When set, a kebab menu with "View More" (→ this href) and "Delete" appears. */
  viewMoreHref?: string;
  /** Called when the card is dismissed via the kebab "Delete" item. */
  onDismiss?: () => void;
  bodyClassName?: string;
  className?: string;
  children: ReactNode;
}) {
  const hasKebab = Boolean(viewMoreHref || onDismiss);
  const hasHeader = Boolean(kicker || title || action || Icon || hasKebab);
  return (
    <section
      className={`flex flex-col rounded-2xl border border-[#E7CDD3]/60 dark:border-white/[0.09] bg-white dark:bg-white/[0.05] shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none ${className}`}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-3 border-b border-[#E7CDD3]/40 dark:border-white/[0.07] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25">
                <Icon size={15} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              {kicker && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]">
                  {kicker}
                </p>
              )}
              {title && (
                <h2 className="truncate text-sm font-bold text-[#111] dark:text-white">{title}</h2>
              )}
            </div>
          </div>
          {(action || hasKebab) && (
            <div className="flex flex-shrink-0 items-center gap-1">
              {action}
              {hasKebab && (
                <KebabMenu
                  label={title ? `${title} options` : "Card options"}
                  items={[
                    ...(viewMoreHref ? [{ label: "View More", href: viewMoreHref }] : []),
                    ...(onDismiss ? [{ label: "Delete", danger: true, onClick: onDismiss }] : []),
                  ]}
                />
              )}
            </div>
          )}
        </div>
      )}
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
