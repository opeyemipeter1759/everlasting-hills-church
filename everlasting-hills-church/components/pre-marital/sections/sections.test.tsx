import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Hero, WhyItMatters } from "./Intro";
import { CounsellingTeam } from "./Journey";

afterEach(cleanup);

describe("the public pre-marital counselling page", () => {
  it("opens with the hero and a way in to the application", () => {
    render(<Hero />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Preparing for a Marriage That Flourishes",
      }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Begin Counselling" })
        .getAttribute("href"),
    ).toBe("#apply");
    expect(screen.queryByRole("link", { name: "How It Works" })).toBeNull();
  });

  it("says why it matters in three short points, with no explanations", () => {
    render(<WhyItMatters />);
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(
      ["Built on God's word", "Honest conversations", "Walked with you"],
    );
  });

  it("keeps the counselling team hidden until it is approved", () => {
    const { container } = render(<CounsellingTeam counsellors={null} />);
    expect(container.textContent).toBe("");
  });
});
