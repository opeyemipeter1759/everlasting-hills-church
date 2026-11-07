import { describe, expect, it } from "vitest";
import { check, countLines, measure, readBaseline, shrinkBaseline, MAX_LINES } from "../scripts/file-length/check.mjs";

/**
 * Every frontend source file stays within MAX_LINES (150). The same check runs
 * in the git pre-commit and pre-push hooks; this keeps it in `npm test` and CI.
 */
describe("frontend file length", () => {
  it(`keeps every file within ${MAX_LINES} lines, and older long files from growing`, () => {
    const result = check(measure(), readBaseline());
    const problems = [
      ...result.tooLong.map((f) => `${f.path}: ${f.lines} lines`),
      ...result.grew.map((f) => `${f.path}: grew to ${f.lines} (was ${f.allowed})`),
    ];
    expect(problems, `Split these files to ${MAX_LINES} lines or less`).toEqual([]);
  });

  it("only ever shrinks the baseline", () => {
    const baseline = readBaseline();
    for (const [path, allowed] of Object.entries(baseline)) {
      expect(allowed, path).toBeGreaterThan(MAX_LINES);
    }
  });
});

describe("the file-length rule", () => {
  it("counts lines like an editor does", () => {
    expect(countLines("")).toBe(0);
    expect(countLines("a\nb\n")).toBe(2);
    expect(countLines("a\r\nb")).toBe(2);
  });

  it("rejects a new long file and a grown old one, and allows an old one that shrank", () => {
    const result = check({ "new.tsx": 151, "old.tsx": 300, "older.tsx": 200, "fine.tsx": 150 }, { "old.tsx": 250, "older.tsx": 400 });
    expect(result.tooLong).toEqual([{ path: "new.tsx", lines: 151 }]);
    expect(result.grew).toEqual([{ path: "old.tsx", lines: 300, allowed: 250 }]);
    expect(result.ok).toBe(false);
  });

  it("takes fixed files off the baseline and never raises a limit", () => {
    const next = shrinkBaseline({ "a.tsx": 120, "b.tsx": 180, "c.tsx": 500 }, { "a.tsx": 300, "b.tsx": 200, "c.tsx": 400, "d.tsx": 999 });
    expect(next).toEqual({ "b.tsx": 180, "c.tsx": 400 });
  });
});
