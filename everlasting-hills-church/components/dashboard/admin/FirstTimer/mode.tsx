"use client";

import { createContext, useContext } from "react";

/**
 * Who is looking at the first-timer records. Admins see everything and can
 * make accounts, import and archive. The First Timer Team (Membership and
 * Assimilation) sees the same list without prayer requests; only its lead,
 * the head of department and admins may edit. The API enforces all of it.
 */
export interface FirstTimersMode {
  team: boolean;
  /** May edit a record. Set from the list the API sends; false until known on the team page. */
  canEdit: boolean;
  listPath: string;
  editPath: (visitorId: string) => string;
}

export const ADMIN_MODE: FirstTimersMode = {
  team: false,
  canEdit: true,
  listPath: "/visitors/first-timers",
  editPath: (id) => `/visitors/${id}`,
};

export const TEAM_MODE: FirstTimersMode = {
  team: true,
  canEdit: false,
  listPath: "/first-timer-team/first-timers",
  editPath: (id) => `/first-timer-team/first-timers/${id}`,
};

const ModeContext = createContext<FirstTimersMode>(ADMIN_MODE);

export const FirstTimersModeProvider = ModeContext.Provider;
export const useFirstTimersMode = () => useContext(ModeContext);
