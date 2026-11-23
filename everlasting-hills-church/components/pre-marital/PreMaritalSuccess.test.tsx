import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PreMaritalSuccess } from "./PreMaritalSuccess";

afterEach(cleanup);

describe("the thank-you after applying", () => {
  it("brings itself into view and takes focus, so the reader is not left further down the page", () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(<PreMaritalSuccess names="Tunde and Ada" referenceCode="PMC-1234" />);
    const box = screen.getByRole("status");
    expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ block: "start" }));
    expect(document.activeElement).toBe(box);
    expect(box.textContent).toContain("Thank you, Tunde and Ada");
  });
});
