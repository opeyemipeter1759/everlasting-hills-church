import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProfileDetails } from "@/lib/api/family";
import ProfileStoryForm from "./ProfileStoryForm";

const save = vi.hoisted(() => vi.fn());
const blank: ProfileDetails = {
  headline: null,
  coverUrl: null,
  favouriteVerse: null,
  favouriteVerseRef: null,
  bornAgainYear: null,
  waterBaptismYear: null,
  holySpiritYear: null,
  membershipClassYear: null,
  occupation: null,
  employer: null,
  industry: null,
  skills: [],
  gifts: [],
  interests: [],
  languages: [],
  prayerFocus: null,
  testimony: null,
  openTo: [],
  visibility: { profile: "MEMBERS", career: "MEMBERS", testimony: "MEMBERS", journey: "MEMBERS", birthday: "MEMBERS", socials: "MEMBERS", phone: "PRIVATE" },
};
vi.mock("@/lib/api/family", () => ({
  useMyProfileDetails: () => ({ data: blank, isLoading: false }),
  useUpdateProfileDetails: () => ({ mutateAsync: save, isPending: false }),
}));

afterEach(() => {
  cleanup();
  save.mockReset();
});

describe("the spiritual and career profile form", () => {
  it("saves what the member writes, and who may see it", async () => {
    save.mockResolvedValue(blank);
    render(<ProfileStoryForm memberId="ada" />);
    fireEvent.change(screen.getByLabelText("Headline"), { target: { value: "Teacher · Choir" } });
    fireEvent.change(screen.getByLabelText("Born again"), { target: { value: "2008" } });
    fireEvent.change(screen.getByLabelText("Occupation"), { target: { value: "Teacher" } });
    fireEvent.change(screen.getByLabelText("Skills"), { target: { value: "Maths" } });
    fireEvent.keyDown(screen.getByLabelText("Skills"), { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "+ Yoruba" }));
    fireEvent.click(screen.getByRole("button", { name: /Career: seen by the church family/ }));
    fireEvent.click(screen.getByRole("button", { name: /My phone number: only me/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][0]).toMatchObject({
      headline: "Teacher · Choir",
      bornAgainYear: 2008,
      occupation: "Teacher",
      skills: ["Maths"],
      languages: ["Yoruba"],
      visibility: { career: "PRIVATE", phone: "MEMBERS" },
    });
    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });
});
