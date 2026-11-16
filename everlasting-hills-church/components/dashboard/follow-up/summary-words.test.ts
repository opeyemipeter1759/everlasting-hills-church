import { describe, expect, it } from "vitest";
import { rollWords, weekWords, type Words } from "./summary-words";

const text = (words: Words) => words.join("");
const roll = { followingUp: 55, firstTimers: 19, secondTimers: 1, thirdTimers: 5, away: 30 };

describe("rollWords", () => {
  it("breaks the Master list down by where people stand", () => {
    expect(text(rollWords(roll))).toBe(
      "The team is following up 55 people: 19 first timers, 1 second timer, 5 third timers and 30 members who've been away.",
    );
  });

  it("leaves out the groups nobody is in, and names a lone group outright", () => {
    expect(text(rollWords({ ...roll, followingUp: 31, secondTimers: 0, thirdTimers: 0, away: 12 }))).toBe(
      "The team is following up 31 people: 19 first timers and 12 members who've been away.",
    );
    expect(text(rollWords({ followingUp: 1, firstTimers: 0, secondTimers: 0, thirdTimers: 0, away: 1 }))).toBe(
      "The team is following up 1 member who's been away.",
    );
    expect(text(rollWords({ followingUp: 0, firstTimers: 0, secondTimers: 0, thirdTimers: 0, away: 0 }))).toBe(
      "Nobody is being followed up right now.",
    );
  });

  it("keeps the figures apart, so they can be set in bold", () => {
    expect(rollWords(roll).filter((w) => typeof w === "number")).toEqual([55, 19, 1, 5, 30]);
  });
});

describe("weekWords", () => {
  it("says who is new, who nobody carries, and who has gone quiet", () => {
    expect(text(weekWords({ newThisWeek: 5, unassigned: 7, quiet: 35 }))).toBe(
      "5 are new this week, 7 have nobody assigned yet and 35 have had no activity logged in the past week.",
    );
    expect(text(weekWords({ newThisWeek: 0, unassigned: 1, quiet: 0 }))).toBe("1 has nobody assigned yet.");
  });

  it("says so when everyone is covered", () => {
    expect(text(weekWords({ newThisWeek: 0, unassigned: 0, quiet: 0 }))).toBe(
      "Everyone has someone assigned and activity logged this week.",
    );
    expect(text(weekWords({ newThisWeek: 1, unassigned: 0, quiet: 0 }))).toBe(
      "1 is new this week. Everyone has someone assigned and activity logged this week.",
    );
  });
});
