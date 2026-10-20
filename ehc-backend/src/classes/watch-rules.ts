/**
 * The rules of watching a lesson video, as pure functions so they are tested on
 * their own. The browser reports where the player is; the server decides what
 * that is worth. Watching can never be credited faster than the clock runs.
 */

/** A heartbeat sooner than this after the last one is ignored: it earns nothing and changes nothing. */
export const HEARTBEAT_MIN_GAP_SECONDS = 5;
/** Slack for network and timer jitter on top of the wall-clock time between two heartbeats. */
export const HEARTBEAT_TOLERANCE_SECONDS = 3;
/** Heartbeats further apart than this start a new stretch of watching and credit nothing for the gap. */
export const SEGMENT_BREAK_SECONDS = 60;
/** The furthest point reached must be within this many seconds of the end. */
export const WATCHED_END_MARGIN_SECONDS = 5;
/** And at least this share of the video must have been credited as watched. */
export const WATCHED_MIN_FRACTION = 0.95;

export interface SessionWatch {
  startedAt: Date;
  lastHeartbeatAt: Date;
  lastPosition: number;
  maxPosition: number;
  accumulatedSeconds: number;
}

export interface LessonWatch {
  maxPosition: number;
  seconds: number;
  lastHeartbeatAt: Date | null;
}

export type HeartbeatNote = 'too_soon' | 'new_segment' | 'jump' | 'not_playing' | 'ok';

export interface HeartbeatResult {
  /** False when the heartbeat was too soon: nothing below has changed. */
  accepted: boolean;
  note: HeartbeatNote;
  /** Seconds of watching credited by this heartbeat. */
  credit: number;
  session: SessionWatch;
  lesson: LessonWatch;
}

const seconds = (from: Date, to: Date) => (to.getTime() - from.getTime()) / 1000;

/**
 * Applies one heartbeat. `position` is where the player says it is, in seconds.
 *
 * - Credit is at most the wall-clock time since the last heartbeat (anywhere on
 *   the lesson, so two tabs cannot double it) plus a small tolerance, and the
 *   total for a sitting is at most the time the sitting has lasted plus the
 *   same tolerance. Sending heartbeats faster earns nothing extra.
 * - A position that jumps further than that allowance is a skip, not
 *   watching: it earns nothing and the last known position is kept.
 * - The furthest point reached only moves by the credit earned, never to
 *   wherever the browser says it is.
 */
export function applyHeartbeat(
  session: SessionWatch,
  lesson: LessonWatch,
  position: number,
  at: Date,
  durationSeconds: number,
): HeartbeatResult {
  const pos = Math.max(0, Math.min(Math.floor(Number.isFinite(position) ? position : 0), durationSeconds));
  const lastBeat = lesson.lastHeartbeatAt && lesson.lastHeartbeatAt > session.lastHeartbeatAt ? lesson.lastHeartbeatAt : session.lastHeartbeatAt;
  const elapsed = seconds(lastBeat, at);

  if (elapsed < HEARTBEAT_MIN_GAP_SECONDS) {
    return { accepted: false, note: 'too_soon', credit: 0, session, lesson };
  }

  const nextSession: SessionWatch = { ...session, lastHeartbeatAt: at };
  const nextLesson: LessonWatch = { ...lesson, lastHeartbeatAt: at };

  if (elapsed > SEGMENT_BREAK_SECONDS) {
    nextSession.lastPosition = pos;
    return { accepted: true, note: 'new_segment', credit: 0, session: nextSession, lesson: nextLesson };
  }

  const delta = pos - session.lastPosition;
  if (delta <= 0) {
    nextSession.lastPosition = pos;
    return { accepted: true, note: 'not_playing', credit: 0, session: nextSession, lesson: nextLesson };
  }

  const allowance = Math.floor(elapsed + HEARTBEAT_TOLERANCE_SECONDS);
  if (delta > allowance) {
    return { accepted: true, note: 'jump', credit: 0, session: nextSession, lesson: nextLesson };
  }

  const sittingCap = Math.floor(seconds(session.startedAt, at) + HEARTBEAT_TOLERANCE_SECONDS);
  const credit = Math.max(0, Math.min(delta, allowance, sittingCap - session.accumulatedSeconds));

  nextSession.lastPosition = pos;
  nextSession.accumulatedSeconds = session.accumulatedSeconds + credit;
  if (credit > 0 && pos > session.maxPosition) nextSession.maxPosition = Math.min(pos, session.maxPosition + credit);
  nextLesson.seconds = lesson.seconds + credit;
  if (credit > 0 && pos > lesson.maxPosition) nextLesson.maxPosition = Math.min(pos, lesson.maxPosition + credit);

  return { accepted: true, note: 'ok', credit, session: nextSession, lesson: nextLesson };
}

/** A video counts as watched when its end was reached and nearly all of it was credited. */
export function watchComplete(durationSeconds: number, maxPosition: number, creditedSeconds: number): boolean {
  if (!(durationSeconds > 0)) return false;
  return maxPosition >= durationSeconds - WATCHED_END_MARGIN_SECONDS && creditedSeconds >= durationSeconds * WATCHED_MIN_FRACTION;
}
