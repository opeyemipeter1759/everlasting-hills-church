import { describe, expect, it } from "vitest";
import type { Pledge } from "@/lib/api/pledges";
import { pledgesCsv } from "./PledgesOverview";

describe("pledge admin export", () => {
  it("includes installment progress and history", () => {
    const pledge: Pledge = {
      id: "pledge-1",
      memberId: null,
      fullName: "Ada Visitor",
      phone: "08012345678",
      email: "ada@example.com",
      amount: 200_000,
      method: "MONTHLY",
      methodOther: null,
      installmentAmount: 50_000,
      completeBy: "2026-12-31",
      contactMe: true,
      installments: [
        {
          id: "installment-1",
          amount: 50_000,
          givenOn: "2026-09-15",
          note: "Bank transfer",
          createdAt: "2026-09-15T10:00:00.000Z",
        },
      ],
      amountGiven: 50_000,
      balance: 150_000,
      progressPercent: 25,
      createdAt: "2026-09-01T10:00:00.000Z",
      updatedAt: "2026-09-15T10:00:00.000Z",
    };

    const csv = pledgesCsv([pledge]);

    expect(csv).toContain("Given (NGN),Balance (NGN),Progress");
    expect(csv).toContain("50000,150000,25%");
    expect(csv).toContain("2026-09-15: 50000 (Bank transfer)");
  });
});
