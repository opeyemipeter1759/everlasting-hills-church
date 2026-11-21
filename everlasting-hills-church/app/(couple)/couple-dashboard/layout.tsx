import Image from "next/image";
import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";

/**
 * The couple dashboard's own frame, for partners who are not members: the
 * church's name, a way out, and nothing from the member area. Members reach
 * the same dashboard inside their usual one (/dashboard/pre-marital).
 */
export default function CoupleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FBF7F8] text-[#111]">
      <header className="border-b border-[#E7CDD3]/70 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#87102C]">
            <Image src="/logoblack.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            <span className="font-serif text-lg font-bold leading-tight">Everlasting Hills Church</span>
          </Link>
          <LogoutButton className="min-h-11 rounded-xl px-3 text-sm font-semibold text-[#87102C] hover:bg-[#FFE8ED] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C]">
            Sign out
          </LogoutButton>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">{children}</main>
    </div>
  );
}
