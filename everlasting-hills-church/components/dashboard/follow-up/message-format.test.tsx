import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageBody } from "./message-format";

/**
 * Messages are built as React elements from plain text, so what people type
 * is shown as written and can never inject markup into the page.
 */
describe("MessageBody", () => {
  it("shows *bold*, _italic_, ~strike~ and `code` as formatting, not as symbols", () => {
    const { container } = render(<MessageBody body="*now* _then_ ~never~ `code`" />);

    expect(container.querySelector("strong")?.textContent).toBe("now");
    expect(container.querySelector("em")?.textContent).toBe("then");
    expect(container.querySelector("s")?.textContent).toBe("never");
    expect(container.querySelector("code")?.textContent).toBe("code");
  });

  it("picks out a mention, including a two-word name", () => {
    const { container } = render(<MessageBody body="@Grace Ade please call her" />);
    const mention = container.querySelector("span.rounded");

    expect(mention?.textContent).toBe("@Grace Ade");
  });

  it("links a URL and opens it safely in a new tab", () => {
    render(<MessageBody body="see https://everlastinghills.church/x" />);
    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("href", "https://everlastinghills.church/x");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("renders angle brackets as text rather than markup", () => {
    const { container } = render(<MessageBody body="<img src=x onerror=alert(1)>" />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("keeps quotes and list bullets on their own lines", () => {
    const { container } = render(<MessageBody body={"> she called back\n- rang twice\n1. left a message"} />);

    expect(container.textContent).toContain("she called back");
    expect(container.textContent).toContain("•");
    expect(container.textContent).toContain("1.");
  });

  it("leaves plain text alone", () => {
    const { container } = render(<MessageBody body="Reached her on Sunday" />);
    expect(container.textContent).toBe("Reached her on Sunday");
  });
});
