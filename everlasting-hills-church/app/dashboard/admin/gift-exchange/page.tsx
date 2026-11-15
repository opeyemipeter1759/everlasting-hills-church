import GiftExchangeAdmin from "@/components/dashboard/admin/gift-exchange/GiftExchangeAdmin";

export const metadata = { title: "Gift Exchange — Dashboard" };

/** Everyone who showed interest in the gift exchange (Admin and above). */
export default function GiftExchangePage() {
  return <GiftExchangeAdmin />;
}
