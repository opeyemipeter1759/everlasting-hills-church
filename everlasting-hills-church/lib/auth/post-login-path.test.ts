import { describe, expect, it } from "vitest";
import { getLandingPage } from "./frontend-session";
import { postLoginPath } from "./post-login-path";

describe("postLoginPath", () => {
  it("opens the reading plan link someone was sent before they signed in", () => {
    expect(postLoginPath({ role: "MEMBER" }, "?next=%2Fdashboard%2Freading%2Fplans%3Fplan%3Dbible-in-four-months"))
      .toBe("/dashboard/reading/plans?plan=bible-in-four-months");
  });

  it("asks for a new password first when one is required", () => {
    expect(postLoginPath({ role: "MEMBER", needsPasswordChange: true }, "?next=%2Fdashboard%2Freading%2Fplans"))
      .toBe("/change-password");
  });

  it("goes to the usual landing page without a safe link to return to", () => {
    expect(postLoginPath({ role: "PASTOR" }, "")).toBe(getLandingPage("PASTOR"));
    expect(postLoginPath({ role: "MEMBER" }, "?next=https%3A%2F%2Fevil.example")).toBe(getLandingPage("MEMBER"));
    expect(postLoginPath({ role: "MEMBER" }, "?next=%2Flogin")).toBe(getLandingPage("MEMBER"));
  });
});
