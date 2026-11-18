import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import VisitorsTable from "./VisitorsTable";
import { ADMIN_MODE, FirstTimersModeProvider, TEAM_MODE } from "./mode";
import type { VisitorRow } from "./types";

vi.mock("@/lib/api/axios", () => ({ apiClient: { post: vi.fn(), patch: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const visitor: VisitorRow = {
  id: "v1",
  firstName: "Ada",
  lastName: "Eze",
  email: "ada@example.com",
  phone: "2348031234567",
  gender: null,
  attendanceType: "In-Person",
  membershipInterest: "Yes",
  howDidYouLearn: null,
  locatedInIbadan: null,
  bornAgain: null,
  occupation: null,
  submittedAt: "2026-11-15T09:00:00.000Z",
};

function table(mode: typeof ADMIN_MODE) {
  return render(
    <FirstTimersModeProvider value={mode}>
      <VisitorsTable rows={[visitor]} onCreated={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
    </FirstTimersModeProvider>,
  );
}

afterEach(cleanup);

describe("the first-timer table, by who is looking", () => {
  it("gives admins the account, edit and delete actions", () => {
    table(ADMIN_MODE);
    expect(screen.getByRole("button", { name: /create account/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /edit ada/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /delete ada/i })).toBeTruthy();
  });

  it("lets the First Timer Team edit, but not make accounts or delete", () => {
    table(TEAM_MODE);
    expect(screen.getByRole("button", { name: /edit ada/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /create account/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /delete ada/i })).toBeNull();
  });
});
