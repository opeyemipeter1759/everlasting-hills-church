import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "./Combobox";

const OPTIONS = [
  { id: "alpha", label: "Alpha" },
  { id: "beta", label: "Beta" },
];

describe("Combobox", () => {
  it("supports search and selection without nested interactive options", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Combobox
        options={OPTIONS}
        value=""
        onChange={onChange}
        searchPlaceholder="Find a person"
      />,
    );

    const trigger = screen.getByRole("button", { name: /select an option/i });
    await user.click(trigger);

    const listbox = screen.getByRole("listbox");
    expect(listbox.querySelector("button")).toBeNull();

    const input = screen.getByRole("combobox", { name: "Find a person" });
    await user.type(input, "bet");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith("beta");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
