/**
 * 2go-style leveling ladder for the member "Streak" card. Endless: level N's task is
 * generated deterministically rather than read from a table, so there's no cap and no
 * new persisted state — a member's level is always a pure function of their lifetime
 * {services attended, courses completed, sermons completed} counts.
 */

export interface TaskRequirement {
  attendance: number;
  course: number;
  sermon: number;
}

const CYCLE_LEN = 7;

/** The task required to clear a given level. Cycles through single-focus attendance/
 * sermon/course tasks, with a combo task every few steps; quantities escalate by one
 * every full cycle (7 levels). */
export function taskForLevel(level: number): TaskRequirement {
  const tier = Math.floor((level - 1) / CYCLE_LEN) + 1;
  const step = ((level - 1) % CYCLE_LEN) + 1;
  const comboQty = Math.max(1, tier - 1);
  switch (step) {
    case 1:
      return { attendance: tier, course: 0, sermon: 0 };
    case 2:
      return { attendance: 0, course: 0, sermon: tier };
    case 3:
      return { attendance: 0, course: tier, sermon: 0 };
    case 4:
      return { attendance: tier, course: 0, sermon: 0 };
    case 5:
      return { attendance: comboQty, course: 0, sermon: comboQty };
    case 6:
      return { attendance: 0, course: 0, sermon: tier };
    default:
      return { attendance: comboQty, course: comboQty, sermon: 0 }; // step 7
  }
}

const RANKS = [
  { minLevel: 1, title: 'Seeker' },
  { minLevel: 4, title: 'Believer' },
  { minLevel: 8, title: 'Disciple' },
  { minLevel: 12, title: 'Faithful' },
  { minLevel: 16, title: 'Overcomer' },
  { minLevel: 20, title: 'Champion' },
  { minLevel: 25, title: 'Legend' }, // caps here — level keeps climbing, title stays "Legend"
];

export function rankTitleFor(level: number): string {
  return [...RANKS].reverse().find((r) => level >= r.minLevel)!.title;
}

export interface PassedLevel {
  level: number;
  title: string;
  task: TaskRequirement;
}

export interface StreakLevel {
  level: number;
  title: string;
  task: TaskRequirement;
  progress: TaskRequirement;
  /** Every level already cleared, oldest first — each entry is the task that was
   * required to pass it (rebuilt from the pure ladder, not separately persisted). */
  history: PassedLevel[];
}

/** Consumes the member's lifetime pool level-by-level (like XP thresholds) until it
 * can't afford the next task — that's the current level, and what's left over is
 * progress already banked toward it. */
export function computeLevel(pool: TaskRequirement): StreakLevel {
  let level = 1;
  const remaining: TaskRequirement = { ...pool };
  const history: PassedLevel[] = [];
  for (;;) {
    const task = taskForLevel(level);
    const affordable =
      remaining.attendance >= task.attendance && remaining.course >= task.course && remaining.sermon >= task.sermon;
    if (!affordable) break;
    remaining.attendance -= task.attendance;
    remaining.course -= task.course;
    remaining.sermon -= task.sermon;
    history.push({ level, title: rankTitleFor(level), task });
    level++;
  }
  return { level, title: rankTitleFor(level), task: taskForLevel(level), progress: remaining, history };
}
