/**
 * Interactive-transaction limits for the follow-up workflow: room to wait for
 * a pooled connection and for a row lock (two deciders, two registrations at
 * once), while still bounding how long a connection is held.
 */
export const WORKFLOW_TX = { maxWait: 10_000, timeout: 20_000 } as const;
