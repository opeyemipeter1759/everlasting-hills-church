import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EvangelismPublicForm from "./EvangelismPublicForm";

const mutateAsync = vi.fn();
vi.mock("@/lib/api/evangelism", () => ({
  usePublicFormOptions: () => ({
    data: { workers: [{ id: "m2", name: "Bola Ade" }], outreaches: [{ id: "o1", name: "Street Outreach – Sept 2026", date: "2026-09-27" }] },
    isLoading: false,
    isError: false,
  }),
  useSubmitPublicContact: () => ({ mutateAsync, isPending: false }),
}));
// The searchable worker list is covered by its own tests; a plain select stands in.
vi.mock("@/components/ui/form/Combobox", () => ({
  Combobox: ({ options, value, onChange }: { options: { id: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
    <select aria-label="Worker" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Choose</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mutateAsync.mockResolvedValue({ ok: true });
});
afterEach(cleanup);

function fillIn() {
  fireEvent.change(screen.getByPlaceholderText("Full name"), { target: { value: "Chinedu Okeke" } });
  fireEvent.change(screen.getByPlaceholderText("0803 123 4567"), { target: { value: "0803 123 4567" } });
  fireEvent.change(screen.getByPlaceholderText("Street, area"), { target: { value: "12 Adeola St" } });
  fireEvent.click(screen.getAllByLabelText("Yes")[0]);
  fireEvent.click(screen.getAllByLabelText("No")[1]);
  fireEvent.change(screen.getByLabelText("Worker"), { target: { value: "m2" } });
  fireEvent.click(screen.getByLabelText("The person agreed to be contacted by the church"));
}

describe("the public evangelism form", () => {
  it("won't send until the required answers are in", async () => {
    render(<EvangelismPublicForm />);
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText("Enter their name")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("asks for the school only for a student", () => {
    render(<EvangelismPublicForm />);
    expect(screen.queryByText("School name")).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText("Yes")[1]);
    expect(screen.getByText("School name")).toBeInTheDocument();
  });

  it("sends it, then offers to record another with the same worker", async () => {
    render(<EvangelismPublicForm />);
    fillIn();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0]).toMatchObject({
      name: "Chinedu Okeke",
      phone: "0803 123 4567",
      savedStatus: "YES",
      isStudent: false,
      workerMemberId: "m2",
      consent: true,
    });
    expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty("website");
    expect(await screen.findByText("Recorded, thank you!")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Submit another/ }));
    expect(screen.getByPlaceholderText("Full name")).toHaveValue("");
    expect(screen.getByLabelText("Worker")).toHaveValue("m2");
  });
});
