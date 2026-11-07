import { describe, expect, it } from "vitest";
import type { OverviewSlot, PrayerWatchOverviewData } from "@/lib/api/prayer-watch-overview";
import { attentionItems } from "./NeedsAttention";

const NOW = new Date("2026-11-07T10:00:00Z").getTime();
const DAY = 86_400_000;

function slot(o: Partial<OverviewSlot>): OverviewSlot {
  return {
    id: "s1",
    label: "First Watch",
    startTime: "22:00",
    endTime: "00:00",
    capacity: 100,
    confirmed: 5,
    workers: 1,
    pending: 0,
    leaderName: "Tolu Ade",
    leaderTermEndsAt: new Date(NOW + 60 * DAY).toISOString(),
    whatsappLinkSet: true,
    ...o,
  };
}

function data(o: Partial<PrayerWatchOverviewData> = {}, slots: OverviewSlot[] = [slot({})]): PrayerWatchOverviewData {
  return {
    generatedAt: new Date(NOW).toISOString(),
    watchTitle: "Prayer Watch",
    telegramLinkSet: true,
    totals: { confirmed: 5, workers: 1, pending: 0, declined: 0, removed: 0, familyChangesPending: 0, reflections30d: 0, reflectionsTotal: 0 },
    oldestPendingAt: null,
    medianWaitHours: null,
    slots,
    weekly: [],
    latestReflection: null,
    ...o,
  };
}

describe("attentionItems", () => {
  it("is empty when every watch is led, linked and nothing waits", () => {
    expect(attentionItems(data(), NOW)).toEqual([]);
  });

  it("puts waiting sign-ups first, with how long the oldest has waited", () => {
    const items = attentionItems(
      data({ telegramLinkSet: false, totals: { ...data().totals, pending: 3 }, oldestPendingAt: new Date(NOW - 2 * DAY).toISOString() }),
      NOW,
    );
    expect(items[0]).toMatchObject({ key: "pending", urgent: true, text: "3 sign-ups waiting for approval", detail: "The oldest has waited 2 days." });
    expect(items[items.length - 1]).toMatchObject({ key: "telegram", urgent: false });
  });

  it("flags a watch with people but no leader, and ignores an empty one", () => {
    const items = attentionItems(data({}, [slot({ leaderName: null, leaderTermEndsAt: null }), slot({ id: "s2", label: "Second Watch", confirmed: 0, leaderName: null })]), NOW);
    expect(items.map((i) => i.key)).toEqual(["leader-s1"]);
  });

  it("calls out a leader whose term is over, and one ending soon", () => {
    const over = attentionItems(data({}, [slot({ leaderTermEndsAt: new Date(NOW - DAY).toISOString() })]), NOW);
    expect(over[0]).toMatchObject({ key: "term-s1", urgent: true });
    const soon = attentionItems(data({}, [slot({ leaderTermEndsAt: new Date(NOW + 10 * DAY).toISOString() })]), NOW);
    expect(soon[0]).toMatchObject({ key: "term-s1", urgent: false });
  });

  it("notes a watch whose family WhatsApp group isn't linked", () => {
    const items = attentionItems(data({}, [slot({ whatsappLinkSet: false })]), NOW);
    expect(items.map((i) => i.key)).toEqual(["wa-s1"]);
  });
});
