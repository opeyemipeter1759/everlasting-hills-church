"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useNow } from "./useNow";

/**
 * One minute-ticking clock for the whole Programs page. The cards are
 * rendered on the server; only their small "live" and "when" pieces read
 * this, so a single timer keeps every card right.
 */
const NowContext = createContext<Date | null>(null);

export function NowProvider({ renderedAt, children }: { renderedAt: string; children: ReactNode }) {
  const now = useNow(renderedAt);
  return <NowContext.Provider value={now}>{children}</NowContext.Provider>;
}

/** The page's clock; a fixed time when given (previews and tests), else now. */
export function usePageNow(fixed?: Date): Date {
  const now = useContext(NowContext);
  return fixed ?? now ?? new Date();
}
