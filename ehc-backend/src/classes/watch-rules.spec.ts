import { applyHeartbeat, watchComplete, type LessonWatch, type SessionWatch } from './watch-rules';

const T0 = new Date('2026-10-21T10:00:00Z');
const at = (s: number) => new Date(T0.getTime() + s * 1000);

const fresh = (position = 0): { session: SessionWatch; lesson: LessonWatch } => ({
  session: { startedAt: T0, lastHeartbeatAt: T0, lastPosition: position, maxPosition: position, accumulatedSeconds: 0 },
  lesson: { maxPosition: position, seconds: 0, lastHeartbeatAt: null },
});

const DURATION = 600;

describe('applyHeartbeat', () => {
  it('credits real playing time, 15 seconds at a time', () => {
    const { session, lesson } = fresh();
    const r = applyHeartbeat(session, lesson, 15, at(15), DURATION);
    expect(r).toMatchObject({ accepted: true, note: 'ok', credit: 15 });
    expect(r.lesson).toMatchObject({ maxPosition: 15, seconds: 15 });
    expect(r.session).toMatchObject({ lastPosition: 15, maxPosition: 15, accumulatedSeconds: 15 });
  });

  it('credits at most the gap plus tolerance when a client claims 300 seconds in a 15 second gap', () => {
    const { session, lesson } = fresh();
    const r = applyHeartbeat(session, lesson, 300, at(15), DURATION);
    expect(r.credit).toBeLessThanOrEqual(18);
    expect(r.note).toBe('jump');
    expect(r.lesson.maxPosition).toBeLessThanOrEqual(18);
  });

  it('never lets the furthest point run ahead of what was credited', () => {
    let { session, lesson } = fresh();
    for (let i = 1; i <= 10; i++) {
      const r = applyHeartbeat(session, lesson, 15 * i + 17, at(15 * i), DURATION);
      session = r.session;
      lesson = r.lesson;
    }
    expect(lesson.maxPosition).toBeLessThanOrEqual(lesson.seconds);
    expect(lesson.seconds).toBeLessThanOrEqual(150 + 3);
  });

  it('ignores heartbeats that arrive too soon, so spamming them earns nothing', () => {
    let { session, lesson } = fresh();
    let credited = 0;
    for (let s = 1; s <= 60; s++) {
      const r = applyHeartbeat(session, lesson, s, at(s), DURATION);
      session = r.session;
      lesson = r.lesson;
      credited += r.credit;
    }
    expect(credited).toBeLessThanOrEqual(63);
    expect(lesson.seconds).toBe(credited);
  });

  it('caps a sitting at the time it has lasted, even with a heartbeat every 5 seconds that claims the allowance', () => {
    let { session, lesson } = fresh();
    for (let i = 1; i <= 12; i++) {
      const r = applyHeartbeat(session, lesson, session.lastPosition + 8, at(5 * i), DURATION);
      session = r.session;
      lesson = r.lesson;
    }
    expect(session.accumulatedSeconds).toBeLessThanOrEqual(63);
  });

  it('does not credit rewinding or a paused player', () => {
    const { session, lesson } = fresh(100);
    const rewound = applyHeartbeat(session, lesson, 90, at(15), DURATION);
    expect(rewound).toMatchObject({ note: 'not_playing', credit: 0 });
    expect(rewound.session.lastPosition).toBe(90);
    const paused = applyHeartbeat(rewound.session, rewound.lesson, 90, at(30), DURATION);
    expect(paused.credit).toBe(0);
  });

  it('starts a new stretch after a long silence and credits nothing for the gap', () => {
    const { session, lesson } = fresh();
    const r = applyHeartbeat(session, lesson, 200, at(90), DURATION);
    expect(r).toMatchObject({ note: 'new_segment', credit: 0 });
    expect(r.session.lastPosition).toBe(200);
  });

  it('measures time since the last heartbeat on any tab, so two tabs cannot double the credit', () => {
    const a = fresh();
    const first = applyHeartbeat(a.session, a.lesson, 15, at(15), DURATION);
    // A second sitting opened at 16s on the same lesson, reporting 15s later.
    const other: SessionWatch = { startedAt: at(16), lastHeartbeatAt: at(16), lastPosition: 15, maxPosition: 15, accumulatedSeconds: 0 };
    const second = applyHeartbeat(other, first.lesson, 30, at(31), DURATION);
    const back = applyHeartbeat(first.session, second.lesson, 30, at(31 + 1), DURATION);
    expect(second.lesson.seconds + back.credit).toBeLessThanOrEqual(15 + 16 + 3);
  });

  it('clamps a position outside the video', () => {
    const { session, lesson } = fresh(595);
    const r = applyHeartbeat(session, lesson, 9999, at(10), DURATION);
    expect(r.session.lastPosition).toBeLessThanOrEqual(DURATION);
    expect(r.lesson.maxPosition).toBeLessThanOrEqual(DURATION);
  });
});

describe('watchComplete', () => {
  it('needs the end reached and 95 percent credited', () => {
    expect(watchComplete(600, 596, 570)).toBe(true);
    expect(watchComplete(600, 594, 600)).toBe(false);
    expect(watchComplete(600, 600, 569)).toBe(false);
  });

  it('is never true for a video with no known length', () => {
    expect(watchComplete(0, 0, 0)).toBe(false);
    expect(watchComplete(-1, 10, 10)).toBe(false);
  });
});
