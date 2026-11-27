import GiftExchangeAdmin from "@/components/dashboard/admin/gift-exchange/GiftExchangeAdmin";

export const metadata = { title: "Picnic & Gift Exchange — Dashboard" };

/** Picnic & gift exchange sign-ups: members, plus the public picnic registrations (Admin and above). */
export default function GiftExchangePage() {
  return <GiftExchangeAdmin />;
}
