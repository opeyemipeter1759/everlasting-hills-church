import { fireEvent, screen } from "@testing-library/react";

/**
 * Pick something from a <Select> in a test. It is a listbox, not a native
 * dropdown, so a test opens it and clicks the row the way a person would.
 */
export function chooseOption(selectName: string | RegExp, optionName: string | RegExp) {
  fireEvent.click(screen.getByRole("combobox", { name: selectName }));
  fireEvent.click(screen.getByRole("option", { name: optionName }));
}
