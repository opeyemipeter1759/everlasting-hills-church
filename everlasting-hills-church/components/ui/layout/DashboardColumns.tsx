import type { ReactNode } from "react";

/**
 * Two independent columns from desktop up: a wide main column (two thirds) and
 * a narrow side column (one third). Each column stacks its cards at their own
 * height, so a long card never stretches or pushes the cards beside it.
 *
 * Below desktop the columns dissolve (`display: contents`) into one list, and
 * each tile's `order` decides where it sits in that list, so a phone reads the
 * page top to bottom in the intended order rather than "all wide cards first".
 */
export function DashboardColumns({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:items-start lg:gap-5">{children}</div>;
}

export function MainColumn({ children }: { children: ReactNode }) {
  return <div className="contents lg:col-span-2 lg:flex lg:min-w-0 lg:flex-col lg:gap-5">{children}</div>;
}

export function SideColumn({ children }: { children: ReactNode }) {
  return <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-5">{children}</div>;
}

/** Position in the single-column (phone and tablet) list. Literal classes so Tailwind keeps them. */
const ORDER = [
  "order-1", "order-2", "order-3", "order-4", "order-5", "order-6", "order-7", "order-8",
  "order-9", "order-10", "order-11", "order-12", "order-[13]", "order-[14]", "order-[15]", "order-[16]",
];

/**
 * One card. A card that renders nothing (no birthdays this week, no gatherings)
 * leaves no empty box or extra gap behind.
 */
export function Tile({ order, children }: { order: number; children: ReactNode }) {
  return <div className={`min-w-0 empty:hidden ${ORDER[order - 1] ?? ""} lg:order-none`}>{children}</div>;
}
