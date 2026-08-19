/**
 * Notification categories. Each is independently toggleable by the member and
 * maps 1:1 to a boolean column on NotificationPreference.
 */
export const PUSH_CATEGORIES = [
  'serviceStarting',
  'serviceReminder',
  'servingReminder',
  'prayerMeeting',
  'announcements',
  'unitAnnouncements',
  'newSermon',
  'milestones',
] as const;

export type PushCategory = (typeof PUSH_CATEGORIES)[number];

/**
 * Defaults applied when a member has no NotificationPreference row.
 *
 * prayerMeeting is false on purpose and must stay that way: a daily
 * notification nobody asked for is the fastest route to a member disabling
 * notifications entirely, taking the service reminders down with it.
 */
export const DEFAULT_PREFERENCES: Record<PushCategory, boolean> = {
  serviceStarting: true,
  serviceReminder: true,
  servingReminder: true,
  prayerMeeting: false,
  announcements: true,
  unitAnnouncements: true,
  newSermon: true,
  milestones: true,
};

/**
 * Categories that ignore quiet hours.
 *
 * Only "the service is starting right now" qualifies: it is time-critical and
 * self-limiting (it fires during a service, which is never at 2am). Everything
 * else can wait for the window to close. Deferring is handled by simply not
 * sending — see the note in PushDispatchService about why suppressed
 * notifications are dropped rather than queued.
 */
export const QUIET_HOURS_EXEMPT: ReadonlySet<PushCategory> = new Set<PushCategory>([
  'serviceStarting',
]);

export interface PushPayload {
  title: string;
  body: string;
  /** In-app path opened on tap. */
  url?: string;
  /** Collapse key: a re-sent reminder replaces the earlier one. */
  tag?: string;
  actions?: { action: string; title: string; url?: string }[];
}

export interface DispatchResult {
  category: PushCategory;
  /** Members eligible after preference and quiet-hours filtering. */
  audienceSize: number;
  /** Subscriptions actually attempted. */
  attempted: number;
  delivered: number;
  failed: number;
  /** Rows deleted because the push service reported them gone (404/410). */
  pruned: number;
}
