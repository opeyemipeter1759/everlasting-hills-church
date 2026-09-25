import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import EventAccordion from "./EventAccordion";

afterEach(cleanup);

describe("EventAccordion", () => {
  it("exposes state and panel relationships to assistive technology", () => {
    render(<EventAccordion items={[{ title: "What time?", body: "6 AM and 8 PM WAT." }]} />);
    const button = screen.getByRole("button", { name: "What time?" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region")).toHaveTextContent("6 AM and 8 PM WAT.");
  });
});
