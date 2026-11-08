import { describe, expect, it } from "vitest";
import { formatUntil, watchStatus } from "./watch-time";

const at = (h: number, m = 0) => new Date(2026, 10, 7, h, m);

describe("prayer watch time", () => {
  it("counts down to tonight's watch", () => {
    expect(watchStatus("22:00", "00:00", at(18, 40))).toEqual({ live: false, minutesUntil: 200 });
    expect(formatUntil(200)).toBe("3h 20m");
    expect(formatUntil(45)).toBe("45m");
    expect(formatUntil(120)).toBe("2h");
  });

  it("knows when the watch is happening, including across midnight", () => {
    expect(watchStatus("22:00", "00:00", at(23, 15)).live).toBe(true);
    expect(watchStatus("23:00", "01:00", at(0, 30)).live).toBe(true);
    expect(watchStatus("23:00", "01:00", at(1, 0))).toEqual({ live: false, minutesUntil: 22 * 60 });
  });

});
