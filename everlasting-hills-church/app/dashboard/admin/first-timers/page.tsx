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

async function safeGet<T>(path: string): Promise<T | null> {
  try {
    return await serverApi.get<T>(path, { cache: "no-store" });
  } catch {
    return null;
  }
}

export default async function FirstTimersPage() {
  const [visitorsRaw, onlineRaw] = await Promise.all([
    safeGet<VisitorApi[]>("/visitors?limit=200"),
    safeGet<{ data: { email: string }[] }>("/online-attendance?take=500"),
  ]);

  const onlineEmails = new Set(
    (onlineRaw?.data ?? []).map((r) => r.email.toLowerCase()),
  );

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
    hasOnlineCheckIn: v.email ? onlineEmails.has(v.email.toLowerCase()) : false,
  }));

  return <FirstTimersClient visitors={visitors} />;
}
