import { describe, expect, it } from "vitest";
import { SUMMARY_MAX_CHARS, SUMMARY_MIN_CHARS, normalizeSummary, summaryProblem } from "./summary-rules";

// The same cases as ehc-backend/src/classes/summary-rules.spec.ts: the two copies of the rules must agree.
const VOCAB = (
  "grace faith family belong house prayer word spirit church love honour walk light shepherd hope mercy truth " +
  "community fellowship scripture service people table welcome promise strength patience kindness gentle " +
  "humble teach learn follow trust obey serve give share gather worship praise thanks rest peace joy " +
  "courage purpose calling growth root plant water harvest season"
).split(" ");

function prose(chars: number): string {
  let out = "";
  let i = 0;
  while (out.length < chars) out += `${VOCAB[i++ % VOCAB.length]} `;
  return out.trim().slice(0, chars).replace(/\s\S*$/, (m) => (m.trim().length < 3 ? "" : m));
}

describe("summaryProblem", () => {
  it("rejects 299 characters and accepts 300 after trimming", () => {
    const base = prose(400);
    const at = (n: number) => base.slice(0, n).replace(/\s+$/, "");
    let n = 300;
    while (normalizeSummary(at(n)).length < SUMMARY_MIN_CHARS) n++;
    const exact = at(n);
    expect(normalizeSummary(exact).length).toBe(SUMMARY_MIN_CHARS);
    expect(summaryProblem(exact)).toBeNull();
    expect(summaryProblem(`   ${exact}   `)).toBeNull();
    expect(summaryProblem(exact.slice(0, -1))).toBe("too_short");
  });

  it("counts repeated whitespace as one space", () => {
    expect(normalizeSummary(prose(300).replace(/ /g, "      "))).toBe(normalizeSummary(prose(300)));
    expect(summaryProblem(`${prose(280)}${" ".repeat(200)}`)).toBe("too_short");
  });

  it("rejects filler", () => {
    expect(summaryProblem("lesson ".repeat(60))).toBe("too_thin");
    expect(summaryProblem("a".repeat(310))).toBe("too_thin");
    expect(summaryProblem(`${"grace ".repeat(30)}${prose(280)}`)).toBe("too_thin");
  });

  it("rejects more than the maximum and accepts an honest summary", () => {
    expect(summaryProblem(prose(SUMMARY_MAX_CHARS + 200))).toBe("too_long");
    expect(summaryProblem(prose(500))).toBeNull();
  });
});
