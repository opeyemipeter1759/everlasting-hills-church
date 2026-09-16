import { describe, expect, it } from "vitest";
import { normalizePledge, normalizePledgeList, type Pledge, type PledgeList } from "./pledges";

const legacyPledge = {
  id: "pledge-1",
  memberId: "member-1",
  fullName: "Test Member",
  phone: "08012345678",
  email: "member@example.com",
  amount: 120000,
  method: "MONTHLY",
  methodOther: null,
  installmentAmount: 20000,
  completeBy: "2027-01-31",
  contactMe: true,
  createdAt: "2026-09-01T12:00:00.000Z",
  updatedAt: "2026-09-01T12:00:00.000Z",
} as Pledge;

describe("pledge response normalization", () => {
  it("adds safe progress values to a legacy pledge response", () => {
    expect(normalizePledge(legacyPledge)).toMatchObject({
      installments: [],
      amountGiven: 0,
      balance: 120000,
      progressPercent: 0,
    });
  });

  it("rebuilds administration totals from normalized pledges", () => {
    const response = {
      campaign: { key: "sound-media", title: "Sound & Media Project" },
      pledges: [legacyPledge],
    } as PledgeList;

    expect(normalizePledgeList(response).totals).toEqual({
      pledges: 1,
      amount: 120000,
      amountGiven: 0,
      balance: 120000,
      wantContact: 1,
    });
  });
});
