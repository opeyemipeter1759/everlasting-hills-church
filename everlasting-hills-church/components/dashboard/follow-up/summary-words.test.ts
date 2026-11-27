import { describe, expect, it } from "vitest";
import { myWords, rollWords, weekWords, type Words } from "./summary-words";

const text = (words: Words) => words.join("");
const roll = { followingUp: 25, firstTimers: 19, secondTimers: 1, thirdTimers: 5 };

describe("rollWords", () => {
  it("breaks the people still being followed up down by how often they have come", () => {
    expect(text(rollWords(roll))).toBe("The team is following up 25 people: 19 first timers, 1 second timer and 5 third timers.");
  });

  it("never mentions Away: it is no longer a status", () => {
    expect(text(rollWords(roll))).not.toMatch(/away/i);
  });

  it("leaves out the groups nobody is in, and names a lone group outright", () => {
    expect(text(rollWords({ ...roll, followingUp: 24, secondTimers: 0 }))).toBe(
      "The team is following up 24 people: 19 first timers and 5 third timers.",
    );
    expect(text(rollWords({ followingUp: 1, firstTimers: 0, secondTimers: 0, thirdTimers: 1 }))).toBe("The team is following up 1 third timer.");
    expect(text(rollWords({ followingUp: 0, firstTimers: 0, secondTimers: 0, thirdTimers: 0 }))).toBe("Nobody is being followed up right now.");
  });

  it("keeps the figures apart, so they can be set in bold", () => {
    expect(rollWords(roll).filter((w) => typeof w === "number")).toEqual([25, 19, 1, 5]);
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
    expect(text(weekWords({ newThisWeek: 0, unassigned: 0, quiet: 0 }))).toBe("Everyone has someone assigned and activity logged this week.");
    expect(text(weekWords({ newThisWeek: 1, unassigned: 0, quiet: 0 }))).toBe(
      "1 is new this week. Everyone has someone assigned and activity logged this week.",
    );
  });
});

describe("a team member's own lines", () => {
  const text = (w: (string | number)[]) => w.join("");
  it("speaks of their own people, not the team's", () => {
    expect(text(rollWords({ followingUp: 3, firstTimers: 2, secondTimers: 1, thirdTimers: 0 }, "you"))).toBe(
      "You are following up 3 people: 2 first timers and 1 second timer.",
    );
    expect(text(rollWords({ followingUp: 0, firstTimers: 0, secondTimers: 0, thirdTimers: 0 }, "you"))).toBe(
      "Nobody is assigned to you to follow up right now.",
    );
  });

  it("says who is still waiting for them and what they logged", () => {
    expect(text(myWords({ waitingFirstContact: 2, contactsThisMonth: 1 }))).toBe(
      "2 are still waiting for your first contact, and you have logged 1 contact this month.",
    );
    expect(text(myWords({ waitingFirstContact: 0, contactsThisMonth: 5 }))).toBe(
      "Everyone has had a first contact from you, and you have logged 5 contacts this month.",
    );
  });
});
