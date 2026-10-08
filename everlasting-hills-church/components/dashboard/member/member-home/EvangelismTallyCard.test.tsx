import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import EvangelismSection from "@/components/dashboard/admin/people/member-detail/EvangelismSection";
import type { EvangelismTally } from "@/lib/api/evangelism";
import { EvangelismTallyCard } from "./EvangelismTallyCard";

const tally = vi.hoisted(() => ({ data: undefined as EvangelismTally | undefined }));
vi.mock("@/lib/api/evangelism", () => ({ useMyEvangelismTally: () => ({ data: tally.data }) }));

const preached: EvangelismTally = {
  reached: 48,
  saved: 12,
  alreadySaved: 3,
  thisYear: { reached: 31, saved: 9 },
  lastContactDate: "2026-10-04T10:00:00.000Z",
};

afterEach(cleanup);

describe("a member's evangelism record", () => {
  it("shows on their dashboard once they have reached someone", () => {
    tally.data = preached;
    render(<EvangelismTallyCard />);
    const card = screen.getByRole("region", { name: "Your evangelism" });
    expect(card).toHaveTextContent("48people reached");
    expect(card).toHaveTextContent("12gave their life to Christ");
    expect(card).toHaveTextContent("This year: 31 people reached · 9 saved");
  });

  it("stays out of the way for members who have not preached", () => {
    tally.data = { ...preached, reached: 0, saved: 0, alreadySaved: 0, thisYear: { reached: 0, saved: 0 }, lastContactDate: null };
    const { container } = render(<EvangelismTallyCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows on the member's detail page for admins", () => {
    render(<EvangelismSection tally={preached} />);
    expect(screen.getByText("Reached").previousSibling).toHaveTextContent("48");
    expect(screen.getByText("Saved").previousSibling).toHaveTextContent("12");
    expect(screen.getByText("Already saved").previousSibling).toHaveTextContent("3");
    expect(screen.getByText("Last preached: 4 Oct 2026")).toBeInTheDocument();
    expect(screen.getByText(/This year: 31 reached · 9 saved/)).toBeInTheDocument();
  });
});
