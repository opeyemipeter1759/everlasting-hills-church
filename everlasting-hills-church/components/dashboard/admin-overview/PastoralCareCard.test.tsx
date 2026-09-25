import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import PastoralCareCard from "./PastoralCareCard";
import type { AdminDashboardData } from "@/lib/types/admin-dashboard";

type Care = AdminDashboardData["pastoralCare"];

function care(overrides: Partial<Care> = {}): Care {
  return {
    prayerRequests: 4,
    openFollowUps: 2,
    atRiskMembers: 0,
    atRisk: [],
    ...overrides,
  };
}

const person = (name: string, reason: string, phone: string | null = "+2348012345678") => ({
  id: name,
  name,
  photoUrl: null,
  phone,
  reason,
  weight: 1,
});

afterEach(cleanup);

describe("PastoralCareCard", () => {
  it("sends each outstanding count to the screen that clears it", () => {
    render(<PastoralCareCard care={care()} />);

    const prayers = screen.getByText(/prayer requests to pray over/i).closest("a");
    expect(prayers).toHaveAttribute("href", "/dashboard/prayer-requests");
    expect(prayers).toHaveTextContent("4");

    const followUps = screen.getByText("Open Follow-ups").closest("a");
    expect(followUps).toHaveAttribute("href", "/dashboard/pastor/follow-ups");
    expect(followUps).toHaveTextContent("2");
  });

  // There is no at-risk screen yet, so that row must not pretend to lead
  // anywhere — a link to a stub reads as broken.
  it("leaves the at-risk count unlinked while no screen exists for it", () => {
    render(<PastoralCareCard care={care({ atRiskMembers: 3 })} />);

    expect(screen.getByText("At-Risk Members").closest("a")).toBeNull();
  });

  it("names who to reach and offers a way to call them", () => {
    render(
      <PastoralCareCard
        care={care({
          atRiskMembers: 2,
          atRisk: [person("Grace Okafor", "Missed 4 in a row"), person("Samuel Ade", "Never attended")],
        })}
      />,
    );

    const grace = screen.getByText("Grace Okafor").closest("li")!;
    expect(grace).toHaveTextContent("Missed 4 in a row");
    expect(within(grace).getByRole("link", { name: /call grace okafor/i })).toHaveAttribute(
      "href",
      "tel:+2348012345678",
    );
  });

  it("omits the call action for someone with no phone number on file", () => {
    render(
      <PastoralCareCard
        care={care({ atRiskMembers: 1, atRisk: [person("No Phone", "Never attended", null)] })}
      />,
    );

    expect(screen.queryByRole("link", { name: /call no phone/i })).toBeNull();
  });

  it("names the most urgent few and counts the rest", () => {
    render(
      <PastoralCareCard
        care={care({
          atRiskMembers: 5,
          atRisk: ["Ada One", "Ben Two", "Cara Three", "Dele Four", "Eze Five"].map((n) =>
            person(n, "Never attended"),
          ),
        })}
      />,
    );

    for (const named of ["Ada One", "Ben Two", "Cara Three"]) {
      expect(screen.getByText(named)).toBeInTheDocument();
    }
    expect(screen.queryByText("Dele Four")).toBeNull();
    expect(screen.getByText(/and 2 more drifting/i)).toBeInTheDocument();
  });

  // Three zeroes read as "no data loaded", which is the opposite of the truth.
  it("says so plainly when there is nothing outstanding", () => {
    render(<PastoralCareCard care={care({ prayerRequests: 0, openFollowUps: 0, atRiskMembers: 0 })} />);

    expect(screen.getByText(/nothing outstanding/i)).toBeInTheDocument();
    expect(screen.queryByText("Open Follow-ups")).toBeNull();
  });
});
