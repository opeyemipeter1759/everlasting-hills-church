import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PublicDailyScriptureSection from "./PublicDailyScriptureSection";

vi.mock("@/components/dashboard/member/member-home/DailyScriptureCard", () => ({
  default: () => <div data-testid="daily-scripture-card">Psalm 23:1</div>,
}));

afterEach(cleanup);

describe("PublicDailyScriptureSection", () => {
  it("renders the daily scripture feature for homepage visitors", () => {
    render(<PublicDailyScriptureSection />);

    expect(
      screen.getByRole("heading", { name: /read it\. carry it\. share hope/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("daily-scripture-card")).toHaveTextContent(
      "Psalm 23:1",
    );
    expect(screen.getByText(/available to everyone/i)).toBeInTheDocument();
  });
});
