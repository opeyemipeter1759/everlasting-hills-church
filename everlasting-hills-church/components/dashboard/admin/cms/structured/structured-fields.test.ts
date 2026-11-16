import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { STRUCTURED_FIELDS } from "./structured-fields";

/**
 * Every structured page type the backend defines needs a form here, or the
 * dashboard CMS opens that page with nothing to edit.
 */
describe("dashboard CMS editor", () => {
  const backend = fs.readFileSync(path.resolve(__dirname, "../../../../../../ehc-backend/src/cms/content-types.ts"), "utf8");
  const block = backend.slice(backend.indexOf("CONTENT_TYPES"), backend.indexOf("export function contentType"));
  const types = Array.from(block.matchAll(/^\s{2}(\w+): \{ schema:/gm), (m) => m[1]);

  it("reads the backend's content types", () => {
    expect(types).toEqual(expect.arrayContaining(["about", "cultures", "eventsIntro", "give", "contact"]));
  });

  it.each(types)("has a form for %s", (type) => {
    expect(STRUCTURED_FIELDS[type]?.length).toBeGreaterThan(0);
  });

  it("lets admins edit every part of Our Culture", () => {
    const keys = STRUCTURED_FIELDS.cultures.map((f) => f.key);
    expect(keys).toEqual(["eyebrow", "title", "accent", "lead", "heroImage", "pillars", "cta"]);
  });
});
