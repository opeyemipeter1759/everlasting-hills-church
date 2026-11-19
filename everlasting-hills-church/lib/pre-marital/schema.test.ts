import { describe, expect, it } from "vitest";
import { FORM_DEFAULTS, lagosToday, problemsOf, toPayload, type PreMaritalFormValues } from "./schema";

const valid: PreMaritalFormValues = {
  ...FORM_DEFAULTS,
  groomFirstName: "Tunde", groomLastName: "Adeyemi", groomPhone: "0803 123 4567", groomEmail: "tunde@example.com", groomIsMember: "YES",
  brideFirstName: "Ada", brideLastName: "Eze", bridePhone: "+234 809 765 4321", brideEmail: "ada@example.com", brideIsMember: "NO",
  consent: true,
};

describe("pre-marital application rules (mirror the API)", () => {
  it("accepts the required answers alone", () => {
    expect(problemsOf(valid)).toEqual({});
  });

  it("gives one plain problem per field", () => {
    expect(problemsOf({ ...valid, groomPhone: "call me", bridePhone: "123", brideEmail: "nope", weddingDate: "2020-01-01", consent: false })).toEqual({
      groomPhone: "Use digits, spaces, + or brackets only",
      bridePhone: "That phone number is too short",
      brideEmail: "Enter a valid email address",
      weddingDate: "The wedding date cannot be in the past",
      consent: "Both of you need to agree to apply",
    });
  });

  it("allows today's date", () => {
    expect(problemsOf({ ...valid, weddingDate: lagosToday() })).toEqual({});
  });

  it("sends yes/no as true/false and leaves blanks out", () => {
    expect(toPayload({ ...valid, message: "  " }, "k")).toMatchObject({
      submissionKey: "k", groomIsMember: true, brideIsMember: false, weddingDate: null, relationshipLength: null, message: null,
    });
  });
});
