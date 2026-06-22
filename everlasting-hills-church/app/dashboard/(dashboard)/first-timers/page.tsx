import { serverApi } from "@/lib/api/server";
import FirstTimersClient, {
  type VisitorRow,
} from "@/components/dashboard/admin/FirstTimersClient";

export const metadata = { title: "First Timers — Dashboard" };
export const dynamic = "force-dynamic";

interface VisitorApi {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  attendanceType: string | null;
  membershipInterest: string | null;
  howDidYouLearn: string | null;
  locatedInIbadan: boolean | null;
  bornAgain: string | null;
  occupation: string | null;
  submittedAt: string;
}
interface MemberApi {
  email: string | null;
}

async function safeGet<T>(path: string): Promise<T | null> {
  try {
    return await serverApi.get<T>(path, { cache: "no-store" });
  } catch {
    return null;
  }
}

export default async function FirstTimersPage() {
  const [visitorsRaw, membersRaw] = await Promise.all([
    safeGet<VisitorApi[]>("/visitors?limit=200"),
    safeGet<MemberApi[]>("/members?status=ACTIVE"),
  ]);

  const visitors: VisitorRow[] = (visitorsRaw ?? []).map((v) => ({
    id: v.id,
    firstName: v.firstName,
    lastName: v.lastName,
    email: v.email,
    phone: v.phone,
    gender: v.gender,
    attendanceType: v.attendanceType,
    membershipInterest: v.membershipInterest,
    howDidYouLearn: v.howDidYouLearn,
    locatedInIbadan: v.locatedInIbadan,
    bornAgain: v.bornAgain,
    occupation: v.occupation,
    submittedAt: v.submittedAt,
  }));

  const memberEmails = (membersRaw ?? [])
    .map((m) => m.email)
    .filter((e): e is string => !!e);

  return <FirstTimersClient visitors={visitors} memberEmails={memberEmails} />;
}
