import { describe, expect, it } from "vitest";
import { userMessageForError } from "./user-message";

describe("userMessageForError", () => {
  it("hides raw route and server errors", () => {
    expect(
      userMessageForError({
        status: 404,
        message: "Cannot POST /pledges/sound-media/mine/installments",
      }),
    ).toBe(
      "This feature is temporarily unavailable. Please refresh the page and try again shortly.",
    );
    expect(userMessageForError({ status: 500, message: "Internal server error" })).not.toMatch(
      /internal server error/i,
    );
  });

  it("keeps useful validation and domain messages", () => {
    expect(userMessageForError({ status: 400, message: "Choose today or an earlier date" })).toBe(
      "Choose today or an earlier date",
    );
    expect(userMessageForError({ status: 404, message: "Make a pledge before recording an installment" })).toBe(
      "Make a pledge before recording an installment",
    );
  });

  // "Try again shortly" is wrong for a schema mismatch: no amount of retrying
  // brings the database level with the code.
  it("says a schema mismatch needs a migration rather than another attempt", () => {
    const message = userMessageForError({ status: 500, code: "PRISMA_P2022", message: "Database error" });

    expect(message).toMatch(/database has not caught up/i);
    expect(message).toMatch(/migration/i);
    expect(message).not.toMatch(/try again shortly/i);
  });

  it("still gives the generic message for an ordinary server failure", () => {
    expect(userMessageForError({ status: 500, message: "Database error" })).toMatch(
      /something went wrong on our side/i,
    );
  });

  it("explains authentication, permission and connection failures", () => {
    expect(userMessageForError({ status: 401, message: "Unauthorized" })).toMatch(/sign in again/i);
    expect(userMessageForError({ status: 403, message: "Forbidden" })).toMatch(/permission/i);
    expect(userMessageForError(new Error("Network Error"))).toMatch(/check your connection/i);
    expect(userMessageForError({ code: "ECONNABORTED", message: "timeout of 10000ms exceeded" })).toMatch(
      /check your connection/i,
    );
  });
});
