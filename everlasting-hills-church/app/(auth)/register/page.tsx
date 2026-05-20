import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="py-12">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-full bg-church-maroon/10 flex items-center justify-center mx-auto mb-6">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#87102C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Member Accounts</h1>
        <p className="text-white/60 leading-relaxed max-w-sm mx-auto text-sm">
          Member accounts at Everlasting Hills Church are created by the admin
          team after your first visit. Fill out our first-timer form and our
          team will set up your account.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
        <Link
          href="/first-timer"
          className="block w-full py-3.5 rounded-full bg-church-maroon text-white text-sm font-semibold text-center hover:bg-[#6E0C24] transition-colors"
        >
          Fill Out First-Timer Form
        </Link>
        <Link
          href="/login"
          className="block w-full py-3.5 rounded-full border border-gray-200 text-gray-600 text-sm font-semibold text-center hover:bg-gray-50 transition-colors"
        >
          I already have an account — Sign In
        </Link>
      </div>
    </div>
  );
}
