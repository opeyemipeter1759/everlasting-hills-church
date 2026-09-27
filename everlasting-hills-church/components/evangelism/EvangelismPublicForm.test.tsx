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
  window.localStorage.clear();
  window.scrollTo = vi.fn() as never;
});
afterEach(cleanup);

const cont = () => fireEvent.click(screen.getByRole("button", { name: /Continue/ }));

function throughToTheEnd() {
  fireEvent.change(screen.getByLabelText("Worker"), { target: { value: "m2" } });
  cont();
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: "Chinedu Okeke" } });
  fireEvent.change(screen.getByLabelText(/Phone number/), { target: { value: "0803 123 4567" } });
  fireEvent.change(screen.getByLabelText(/Address/), { target: { value: "12 Adeola St" } });
  cont();
  fireEvent.click(screen.getByLabelText("Yes, they gave their life to Christ"));
  fireEvent.click(screen.getByLabelText("No"));
  cont();
  fireEvent.click(screen.getByLabelText("Invite to church"));
  fireEvent.click(screen.getByLabelText("The person agreed to be contacted by the church"));
}

describe("the public evangelism form", () => {
  it("goes step by step, and won't move on without the step's answers", () => {
    render(<EvangelismPublicForm />);
    expect(screen.getByText("Step 1 of 4 — Outreach")).toBeInTheDocument();
    cont();
    expect(screen.getByText("Choose who preached to them")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 4 — Outreach")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Worker"), { target: { value: "m2" } });
    cont();
    expect(screen.getByText("Step 2 of 4 — Person")).toBeInTheDocument();
    cont();
    expect(screen.getByText("Enter their name")).toBeInTheDocument();
  });

  it("asks for the school only for a student", () => {
    render(<EvangelismPublicForm />);
    fireEvent.change(screen.getByLabelText("Worker"), { target: { value: "m2" } });
    cont();
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/Phone number/), { target: { value: "08031234567" } });
    fireEvent.change(screen.getByLabelText(/Address/), { target: { value: "Bodija" } });
    cont();
    expect(screen.queryByLabelText(/School name/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Yes"));
    expect(screen.getByLabelText(/School name/)).toBeInTheDocument();
  });

  it("sends it once: reaching the last step doesn't send it, and a double tap doesn't send it twice", async () => {
    let resolve: (v: unknown) => void = () => {};
    mutateAsync.mockImplementation(() => new Promise((r) => (resolve = r)));
    render(<EvangelismPublicForm />);
    throughToTheEnd();
    expect(screen.getByText("Step 4 of 4 — Follow-up")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();

    const submitButton = screen.getByRole("button", { name: /Submit/ });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    fireEvent.submit(submitButton.closest("form")!);
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    resolve({ ok: true });
    expect(await screen.findByText("Recorded, thank you!")).toBeInTheDocument();
    expect(mutateAsync).toHaveBeenCalledTimes(1);
  });

  it("sends it, then goes straight to the next person with the same worker", async () => {
    render(<EvangelismPublicForm />);
    throughToTheEnd();
    fireEvent.click(screen.getByRole("button", { name: /Submit/ }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0]).toMatchObject({
      name: "Chinedu Okeke",
      phone: "0803 123 4567",
      savedStatus: "YES",
      isStudent: false,
      workerMemberId: "m2",
      nextAction: "INVITE",
      consent: true,
    });
    expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty("website");
    expect(await screen.findByText("Recorded, thank you!")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit another" }));
    expect(screen.getByText("Step 2 of 4 — Person")).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/)).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(screen.getByLabelText("Worker")).toHaveValue("m2");
  });
});
