import { getAllServicesWithCounts } from "@/services/attendance.service";
import { signServiceId } from "@/lib/qr/sign";
import ServicesView from "@/components/dashboard/admin/ServicesView";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function ServicesPage() {
  const services = await getAllServicesWithCounts();

  const serialised = services.map((s) => ({
    id: s.id,
    name: s.name,
    scheduledAt: s.scheduledAt.toISOString(),
    attendanceCount: s._count.attendance,
    qrUrl: `${APP_URL}/api/attendance/qr-checkin?serviceId=${s.id}&sig=${signServiceId(s.id)}`,
  }));

  return <ServicesView services={serialised} />;
}
