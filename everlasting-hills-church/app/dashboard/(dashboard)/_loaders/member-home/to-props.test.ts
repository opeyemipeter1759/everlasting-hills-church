import { describe, expect, it } from "vitest";
import { toMemberHomeProps } from "./to-props";
import type { MemberHomeData } from "./types";

const sermon = { slug: "s", title: "Grace", speaker: "Pst. A", date: "2026-10-01", thumbnailUrl: null };

describe("toMemberHomeProps", () => {
  it("leaves everything to MemberHome's defaults when the request failed", () => {
    expect(toMemberHomeProps(null)).toEqual({});
  });

  it("turns the /member-home answer into the page's props", () => {
    const props = toMemberHomeProps({
      me: {
        profileId: "p1", role: "MEMBER", tenantId: "t",
        member: {
          id: "1234-abcd", firstName: "Ada", lastName: "Obi", email: "ada@x.org", phone: null, address: null,
          dateOfBirth: "1990-05-01T00:00:00.000Z", bio: null, photoUrl: null, joinedAt: "2020-01-01",
        },
      },
      bookmarks: [{ Sermon: { ...sermon, audioUrl: "a.mp3" } }],
      listenHistory: [{ positionSec: 30, completed: false, Sermon: { ...sermon, audioDuration: 600 } }],
      sermonStreak: 2,
      overview: { attendance: { marked: 3, total: 8, percentage: 38, lastMarkedAt: null }, streak: { level: 2 }, coursesCompleted: 1, sermonsCompleted: 5 },
      announcements: [], communityFeed: [], communityBirthdays: [],
      unavailable: [],
    } as unknown as MemberHomeData);

    expect(props.member).toMatchObject({ firstName: "Ada", dateOfBirth: "1990-05-01" });
    expect(props.memberDisplayId).toBe("EHC-ABCD");
    expect(props.attendanceCount).toBe(3);
    expect(props.attendanceRate).toBe(38);
    expect(props.sermonStreak).toBe(2);
    expect(props.coursesCompleted).toBe(1);
    expect(props.bookmarks?.[0]).toMatchObject({ slug: "s", audioUrl: "a.mp3" });
    expect(props.listenHistory?.[0]).toMatchObject({ positionSec: 30, audioDuration: 600 });
  });

  it("keeps MemberHome's default streak when the overview failed", () => {
    const props = toMemberHomeProps({ me: null, overview: null, unavailable: ["overview"] } as unknown as MemberHomeData);
    expect(props).not.toHaveProperty("streak");
    expect(props.attendanceCount).toBe(0);
  });
});
