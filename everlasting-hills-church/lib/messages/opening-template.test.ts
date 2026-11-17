import { describe, expect, it } from "vitest";
import { WHATSAPP_MAX, draftProblems, longestWhatsApp, unknownPlaceholders } from "./opening-template";

const church = { churchName: "Everlasting Hills Church", serviceTimes: "Sundays at 9:00 AM and Wednesdays at 5:30 PM" };
const good = { whatsappBody: "Hello {{firstName}}, this is {{ contactName }}.", emailSubject: "Welcome, {{firstName}}", emailBody: "Hello {{firstName}}" };

describe("opening message rules (mirrors the API)", () => {
  it("accepts the five fill-ins and nothing else", () => {
    expect(unknownPlaceholders("{{firstName}} {{churchName}} {{serviceTimes}} {{contactName}} {{contactPhone}}")).toEqual([]);
    expect(unknownPlaceholders("{{name}} and {{firstname}}", "{{name}}")).toEqual(["name", "firstname"]);
    expect(unknownPlaceholders("Hi {{firstName")).toEqual(["unclosed braces"]);
  });

  it("counts the WhatsApp message at its longest once names are filled in", () => {
    expect(longestWhatsApp("{{firstName}}", church)).toBe(30);
    expect(longestWhatsApp("  {{churchName}}\n", church)).toBe(church.churchName.length);
  });

  it("lists every problem with a draft, in plain words", () => {
    expect(draftProblems(good, church)).toEqual([]);
    expect(draftProblems({ ...good, emailBody: "Hi {{name}}" }, church).join(" ")).toContain("{{name}}");
    expect(draftProblems({ ...good, whatsappBody: "x".repeat(WHATSAPP_MAX) + "{{firstName}}" }, church)).toHaveLength(1);
    expect(draftProblems({ ...good, emailSubject: " " }, church)).toEqual(["Write an email subject"]);
  });
});
