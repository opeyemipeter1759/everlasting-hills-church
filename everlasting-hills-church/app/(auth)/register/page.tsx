import Link from "next/link";
import { UserPlus, ArrowRight, MapPin, Calendar } from "lucide-react";
import AuthSplitScreen from "@/components/auth/AuthSplitScreen";
import { AuthDivider } from "@/components/auth/AuthDivider";

export default function RegisterPage() {
  return (
    <AuthSplitScreen
      scripture="Behold, how good and how pleasant it is for brethren to dwell together in unity!"
      scriptureRef="Psalm 133:1"
      supportingCopy="At Everlasting Hills, membership is a covenant — not a sign-up form. Start by meeting us in person, and we'll set up your account."
    >
      <AuthDivider label="Begin Your Journey" />

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-2">
        Welcome to the family
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8 max-w-sm mx-auto leading-relaxed">
        Member accounts are created by our pastoral team after your first visit. Tell us
        you&apos;re coming, and we&apos;ll be ready to receive you.
      </p>

      <div className="space-y-3 mb-7">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="w-9 h-9 rounded-lg bg-[#87102C]/10 flex items-center justify-center flex-shrink-0">
            <Calendar size={16} className="text-[#87102C]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Sundays · 8:30 AM</p>
            <p className="text-xs text-gray-500">Service starts on time. Come early to settle in.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="w-9 h-9 rounded-lg bg-[#87102C]/10 flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-[#87102C]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Ibadan, Nigeria</p>
            <p className="text-xs text-gray-500">See the find-us page for directions.</p>
          </div>
        </div>
      </div>

      <Link
        href="/first-timer"
        className="group flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#87102C] to-[#a52242] text-white text-sm font-bold tracking-wide hover:from-[#6E0C24] hover:to-[#87102C] transition-all shadow-lg shadow-[#87102C]/20 hover:shadow-xl hover:shadow-[#87102C]/30 hover:-translate-y-0.5"
      >
        <UserPlus size={16} />
        Fill the First-Timer Form
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </Link>

      <p className="text-center text-xs text-gray-500 mt-5">
        Already have an account?{" "}
        <Link href="/login" className="text-[#87102C] font-bold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthSplitScreen>
  );
}
