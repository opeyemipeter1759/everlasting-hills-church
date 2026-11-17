"use client";

import { createContext, useContext } from "react";

/**
 * Who is looking at the first-timer records. Admins see everything and can
 * make accounts, import and archive. The First Timer Team (Membership and
 * Assimilation) sees the same list without prayer requests, and can edit;
 * the API enforces both.
 */
export interface FirstTimersMode {
  team: boolean;
  listPath: string;
  editPath: (visitorId: string) => string;
}

export const ADMIN_MODE: FirstTimersMode = {
  team: false,
  listPath: "/visitors/first-timers",
  editPath: (id) => `/visitors/${id}`,
};

export const TEAM_MODE: FirstTimersMode = {
  team: true,
  listPath: "/first-timer-team/first-timers",
  editPath: (id) => `/first-timer-team/first-timers/${id}`,
};

const ModeContext = createContext<FirstTimersMode>(ADMIN_MODE);

export const FirstTimersModeProvider = ModeContext.Provider;
export const useFirstTimersMode = () => useContext(ModeContext);
