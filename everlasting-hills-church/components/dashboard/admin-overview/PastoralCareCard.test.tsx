import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import PastoralCareCard from "./PastoralCareCard";
import type { AdminDashboardData } from "@/lib/types/admin-dashboard";

type Care = AdminDashboardData["pastoralCare"];

function care(overrides: Partial<Care> = {}): Care {
  return {
    questions: 3,
    testimonies: 2,
    prayerRequests: 4,
    ...overrides,
  };
}

afterEach(cleanup);

describe("PastoralCareCard", () => {
  it("shows each pastoral intake queue and links to the screen that clears it", () => {
    render(<PastoralCareCard care={care()} />);

    const questions = screen.getByText(/questions waiting for an answer/i).closest("a");
    expect(questions).toHaveAttribute("href", "/dashboard/questions");
    expect(questions).toHaveTextContent("3");

    const testimonies = screen.getByText(/testimonies to review/i).closest("a");
    expect(testimonies).toHaveAttribute("href", "/dashboard/testimonies");
    expect(testimonies).toHaveTextContent("2");

    const prayers = screen.getByText(/prayer requests to pray over/i).closest("a");
    expect(prayers).toHaveAttribute("href", "/dashboard/prayer-requests");
    expect(prayers).toHaveTextContent("4");
  });

  it("says plainly when all three queues are clear", () => {
    render(<PastoralCareCard care={care({ questions: 0, testimonies: 0, prayerRequests: 0 })} />);

    expect(screen.getByText(/nothing waiting for review/i)).toBeInTheDocument();
    expect(screen.queryByText(/questions waiting for an answer/i)).toBeNull();
    expect(screen.getByText(/questions are answered, testimonies are reviewed/i)).toBeInTheDocument();
  });
});
