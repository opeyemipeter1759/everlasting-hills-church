import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Modal from "./Modal";

function ModalHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open preferences</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Preferences"
        description="Choose your settings"
      >
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </Modal>
    </>
  );
}

describe("Modal", () => {
  it("moves, traps, and restores keyboard focus", async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);

    const opener = screen.getByRole("button", { name: "Open preferences" });
    await user.click(opener);

    const dialog = screen.getByRole("dialog", { name: "Preferences" });
    expect(dialog).toHaveAccessibleDescription("Choose your settings");
    await waitFor(() => expect(screen.getByRole("button", { name: "Close" })).toHaveFocus());

    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Last action" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
