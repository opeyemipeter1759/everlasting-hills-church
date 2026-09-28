import { describe, expect, it } from "vitest";
import type { FormValues } from "./_steps";
import { firstStepWith, problemsFromError } from "./server-errors";

const STEP_FIELDS: (keyof FormValues)[][] = [
  ["first_name", "last_name", "phone_number", "email", "attendance_type", "gender"],
  ["how_did_you_learn", "invited_by"],
  ["located_in_ibadan", "membership_interest"],
  ["address", "birth_month", "birth_day", "is_student", "occupation", "born_again"],
  ["service_experience", "whatsapp_interest"],
];
const FIELDS = STEP_FIELDS.flat();

describe("reading the first-timer form's server errors", () => {
  it("points a duplicate email back at the email field on step 1, in plain words", () => {
    const problems = problemsFromError({ message: 'A visitor with email "ada@x.test" already exists' }, FIELDS);
    expect(problems).toEqual([{ field: "email", message: expect.stringContaining("already been used to register") }]);
    expect(firstStepWith(problems, STEP_FIELDS)).toBe(0);
  });

  it("does the same for a duplicate phone number", () => {
    const problems = problemsFromError({ message: 'A visitor with phone number "+2348031234567" already exists' }, FIELDS);
    expect(problems[0].field).toBe("phone_number");
  });

  it("reads every field a validation error names, and goes to the earliest step", () => {
    const problems = problemsFromError(
      { message: "birth_day must not be greater than 31", details: ["birth_day must not be greater than 31", "email must be an email"] },
      FIELDS,
    );
    expect(problems.map((p) => p.field)).toEqual(["birth_day", "email"]);
    expect(firstStepWith(problems, STEP_FIELDS)).toBe(0);
  });

  it("leaves errors that aren't about an answer to the banner", () => {
    const problems = problemsFromError({ message: "Couldn't reach the server. Check your connection." }, FIELDS);
    expect(problems).toEqual([]);
    expect(firstStepWith(problems, STEP_FIELDS)).toBeNull();
  });
});
