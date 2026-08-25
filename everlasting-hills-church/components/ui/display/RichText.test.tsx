import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RichText from "./RichText";

const ANNOUNCEMENT = [
  "### **AT HIS FEET**",
  "",
  "Dear Church Family, join us for **an evening of worship**.",
  "**Date:** 25-08-2026",
  "**Time:** 8:00 PM",
  "Meeting Link: https://www.youtube.com/live/MvEJbc5EPCk?si=PJKNOFnFmbjjr4xr",
].join("\n");

describe("RichText", () => {
  it("renders markers as formatting instead of literal text", () => {
    const { container } = render(<RichText text={ANNOUNCEMENT} />);

    expect(container.textContent).not.toContain("**");
    expect(container.textContent).not.toContain("###");
    expect(screen.getByText("AT HIS FEET").tagName).toBe("STRONG");
    expect(screen.getByText("an evening of worship").tagName).toBe("STRONG");
  });

  it("makes a pasted link clickable and safe to open", () => {
    render(<RichText text={ANNOUNCEMENT} />);
    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("href", "https://www.youtube.com/live/MvEJbc5EPCk?si=PJKNOFnFmbjjr4xr");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("keeps line breaks so detail lines do not run together", () => {
    const { container } = render(<RichText text={"Date: today\nTime: 8:00 PM"} />);
    const paragraph = container.querySelector("p");

    // whitespace-pre-line is what preserves the author's single newlines; without
    // it the two details collapse onto one line.
    expect(paragraph?.className).toContain("whitespace-pre-line");
    expect(paragraph?.textContent).toContain("\n");
  });

  it("renders a bullet run as a list", () => {
    render(<RichText text={"Bring:\n- Bible\n- Notebook"} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders nothing for an empty body", () => {
    const { container } = render(<RichText text="" />);
    expect(container).toBeEmptyDOMElement();
  });
});
