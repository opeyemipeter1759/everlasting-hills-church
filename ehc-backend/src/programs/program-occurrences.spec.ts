import { describeSchedule, eyebrowFor, occurrencesFor, sessionWindows, type ScheduleInput } from './program-occurrences';

/** Lagos is UTC+1 all year. `at('2026-11-23T23:30Z')` reads the instant as written. */
const at = (iso: string) => new Date(iso);
const lagos = (d: Date | undefined) => d && new Date(d.getTime() + 3_600_000).toISOString().slice(0, 16).replace('T', ' ');

const base: ScheduleInput = {
  cadence: 'WEEKLY',
  programType: 'PRAYER',
  recurrenceRule: null,
  startTime: null,
  durationMinutes: null,
  startOffsetDays: 0,
  timezone: 'Africa/Lagos',
  dateStatus: 'CONFIRMED',
  editions: [],
  sessions: [],
};
const prayerWatch: ScheduleInput = {
  ...base,
  recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,TU,TH,FR,SA',
  startTime: '22:00',
  durationMinutes: 480,
  sessions: [
    { name: 'The Seers', startTime: '22:00', endTime: '00:00' },
    { name: 'The Watch-House', startTime: '00:00', endTime: '02:00' },
    { name: 'The Threshers', startTime: '02:00', endTime: '04:00' },
    { name: 'The Gatekeepers', startTime: '04:00', endTime: '06:00' },
  ],
};
const dew: ScheduleInput = { ...base, cadence: 'MONTHLY', programType: 'PROPHETIC', recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=-1', startTime: '22:00', durationMinutes: 2880 };
const homecoming: ScheduleInput = {
  ...base,
  cadence: 'ANNUAL',
  programType: 'CONFERENCE',
  recurrenceRule: 'FREQ=YEARLY;BYMONTH=4;BYDAY=-1SA',
  startTime: '10:00',
  durationMinutes: 4320,
  startOffsetDays: -1,
  dateStatus: 'TBA',
};
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe('program occurrences, computed in Africa/Lagos', () => {
  // 2026-11-23 is a Monday.
  it('Prayer Watch: the next watch is tonight at 10 PM, then Tuesday, then Thursday (no Wednesday)', () => {
    const r = occurrencesFor(prayerWatch, at('2026-11-23T12:00:00Z'));
    expect(r.current).toBeNull();
    expect(r.upcoming.map((o) => lagos(o.start))).toEqual(['2026-11-23 22:00', '2026-11-24 22:00', '2026-11-26 22:00']);
    expect(lagos(r.upcoming[0].end)).toBe('2026-11-24 06:00');
  });

  it('Prayer Watch crossing midnight: at 1 AM Tuesday the Monday watch is live, in The Watch-House', () => {
    const now = at('2026-11-24T00:00:00Z'); // 01:00 Tuesday in Lagos
    const r = occurrencesFor(prayerWatch, now);
    expect(lagos(r.current?.start)).toBe('2026-11-23 22:00');
    const live = sessionWindows(prayerWatch, r.current!).find((s) => s.start <= now && now < s.end);
    expect(live?.name).toBe('The Watch-House');
    expect(lagos(r.upcoming[0].start)).toBe('2026-11-24 22:00');
  });

  it.each([
    ['22:59', 'The Seers'],
    // 23:00 UTC is midnight in Lagos: The Watch-House takes over on the hour.
    ['23:00', 'The Watch-House'],
    ['23:30', 'The Watch-House'],
    ['23:59', 'The Watch-House'],
  ])('around the last UTC hour (%s UTC Monday) the Monday watch is live, in %s', (time, session) => {
    const now = at(`2026-11-23T${time}:00Z`);
    const r = occurrencesFor(prayerWatch, now);
    expect(lagos(r.current?.start)).toBe('2026-11-23 22:00');
    expect(sessionWindows(prayerWatch, r.current!).find((s) => s.start <= now && now < s.end)?.name).toBe(session);
  });

  it('in the last UTC hour of a Wednesday (already Thursday in Lagos) nothing is live and Thursday night is next', () => {
    const r = occurrencesFor(prayerWatch, at('2026-11-25T23:30:00Z'));
    expect(r.current).toBeNull();
    expect(lagos(r.upcoming[0].start)).toBe('2026-11-26 22:00');
  });

  it('Dew of Heaven: from 10 PM on the last day of the month, for 48 hours across the new month', () => {
    const r = occurrencesFor(dew, at('2026-11-23T12:00:00Z'));
    expect(r.upcoming.map((o) => lagos(o.start))).toEqual(['2026-11-30 22:00', '2026-12-31 22:00', '2027-01-31 22:00']);
    expect(lagos(r.upcoming[0].end)).toBe('2026-12-02 22:00');
    const during = occurrencesFor(dew, at('2026-12-01T15:00:00Z'));
    expect(lagos(during.current?.start)).toBe('2026-11-30 22:00');
  });

  it('Homecoming: the last weekend of April, Friday to Sunday, once the date is confirmed', () => {
    const confirmed = occurrencesFor({ ...homecoming, dateStatus: 'CONFIRMED' }, at('2026-11-23T12:00:00Z'));
    // The last Saturday of April 2027 is the 24th, so the weekend starts Friday the 23rd.
    expect(lagos(confirmed.upcoming[0].start)).toBe('2027-04-23 10:00');
    expect(lagos(confirmed.upcoming[0].end)).toBe('2027-04-26 10:00');
  });

  it('a programme whose date is to be announced has no occurrence', () => {
    const r = occurrencesFor(homecoming, at('2026-11-23T12:00:00Z'));
    expect(r).toEqual({ current: null, upcoming: [] });
    expect(occurrencesFor({ ...base, cadence: 'CUSTOM', dateStatus: 'TBA' }, at('2026-11-23T12:00:00Z')).upcoming).toEqual([]);
  });

  it('editions override the rule: Furnace runs only on its confirmed edition dates', () => {
    const furnace: ScheduleInput = {
      ...base,
      cadence: 'ANNUAL',
      programType: 'CONSECRATION',
      recurrenceRule: 'FREQ=YEARLY;BYMONTH=10;BYMONTHDAY=1',
      startTime: null,
      dateStatus: 'TBA',
      editions: [
        { label: "Furnace '26", theme: 'Dominion', startsOn: day('2026-10-02'), endsOn: day('2026-10-31'), dateStatus: 'CONFIRMED' },
        { label: "Furnace '27", theme: null, startsOn: null, endsOn: null, dateStatus: 'TBA' },
      ],
    };
    const during = occurrencesFor(furnace, at('2026-10-15T12:00:00Z'));
    expect(during.current?.label).toBe("Furnace '26");
    expect(lagos(during.current?.start)).toBe('2026-10-02 00:00');
    expect(lagos(during.current?.end)).toBe('2026-11-01 00:00');
    expect(occurrencesFor(furnace, at('2026-11-23T12:00:00Z'))).toEqual({ current: null, upcoming: [] });
    const next = occurrencesFor(
      { ...furnace, editions: [...furnace.editions, { label: "Furnace '27", theme: null, startsOn: day('2027-10-01'), endsOn: day('2027-10-31'), dateStatus: 'CONFIRMED' }] },
      at('2026-11-23T12:00:00Z'),
    );
    expect(next.upcoming.map((o) => o.label)).toEqual(["Furnace '27"]);
  });
});

describe('describing a schedule in words', () => {
  it('reads the Prayer Watch as five nights, 10 PM to 6 AM WAT', () => {
    expect(describeSchedule(prayerWatch)).toBe('Every Monday, Tuesday, Thursday, Friday and Saturday night, 10:00 PM to 6:00 AM WAT');
    expect(eyebrowFor(prayerWatch)).toBe('WEEKLY WATCH · MON TUE THU FRI SAT');
  });

  it('reads monthly and yearly rules, and a date still to be announced', () => {
    expect(describeSchedule(dew)).toBe('From 10:00 PM WAT on the last day of every month, for 2 days');
    expect(describeSchedule({ ...dew, recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=15', durationMinutes: 120 })).toBe('On day 15 of every month, 10:00 PM to 12:00 AM WAT');
    expect(describeSchedule({ ...homecoming, dateStatus: 'CONFIRMED' })).toBe('The last weekend of April');
    expect(describeSchedule(homecoming)).toBe('April. Date to be announced');
    expect(describeSchedule({ ...base, cadence: 'CUSTOM', dateStatus: 'TBA' })).toBe('Date to be announced');
    expect(eyebrowFor(homecoming)).toBe('ANNUAL CONFERENCE · APRIL');
    expect(eyebrowFor(dew)).toBe('MONTHLY · LAST DAY OF THE MONTH');
  });

  it('takes an annual programme run by editions to the month of its last edition', () => {
    const furnace: ScheduleInput = {
      ...base,
      cadence: 'ANNUAL',
      programType: 'CONSECRATION',
      dateStatus: 'TBA',
      editions: [{ label: "Furnace '26", theme: 'Dominion', startsOn: day('2026-10-02'), endsOn: day('2026-10-31'), dateStatus: 'CONFIRMED' }],
    };
    expect(describeSchedule(furnace)).toBe('October. Date to be announced');
    expect(eyebrowFor(furnace)).toBe('ANNUAL CONSECRATION · OCTOBER');
  });
});
