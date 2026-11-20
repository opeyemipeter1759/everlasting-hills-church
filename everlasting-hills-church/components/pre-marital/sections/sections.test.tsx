import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Hero, WhoCanApply } from "./Intro";
import { CounsellingTeam, Curriculum, HowItWorks } from "./Journey";

const policy = { eligibility: null, duration: "Six sessions over three months", fees: null, counsellors: null, retention: null, privacyNotice: "x" };

afterEach(cleanup);

describe("the public pre-marital counselling page", () => {
  it("opens with the hero and its two ways in", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1, name: "Preparing for a Marriage That Flourishes" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Begin Counselling" }).getAttribute("href")).toBe("#apply");
    expect(screen.getByRole("link", { name: "How It Works" }).getAttribute("href")).toBe("#how-it-works");
    expect(screen.getByText(/covenant that deserves spiritual preparation/)).toBeTruthy();
  });

  it("shows only approved policy, and says the pastors will confirm the rest", () => {
    render(<WhoCanApply policy={policy} />);
    expect(screen.getByText("Six sessions over three months")).toBeTruthy();
    expect(screen.getAllByText(/will confirm this with you/)).toHaveLength(2);
  });

  it("labels modules proposed until a Pastor approves them", () => {
    render(
      <Curriculum
        modules={[
          { id: "1", title: "Spiritual Unity", description: null, scriptureRefs: ["Amos 3:3"], objectives: [], approvalState: "PROPOSED" },
          { id: "2", title: "Finances & Stewardship", description: null, scriptureRefs: [], objectives: [], approvalState: "APPROVED" },
        ]}
      />,
    );
    expect(screen.getAllByText("Proposed")).toHaveLength(1);
  });

  it("keeps the counselling team hidden until it is approved", () => {
    const { container } = render(<CounsellingTeam counsellors={null} />);
    expect(container.textContent).toBe("");
    render(<HowItWorks />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });
});
