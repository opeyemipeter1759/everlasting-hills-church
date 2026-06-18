import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Page Not Found — Everlasting Hills Church",
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-church-dark px-5 text-center text-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute right-[-10%] top-[-20%] h-[60%] w-[60%] rounded-full bg-[#87102C]/15 blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[50%] w-[50%] rounded-full bg-[#87102C]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-lg">
        <p className="font-display text-7xl font-black text-[#87102C] sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          We could not find that page
        </h1>
        <p className="mx-auto mt-4 max-w-md text-white/55">
          The page you are looking for may have moved or no longer exists. Let
          us help you find your way home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-7 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24]"
          >
            <Home size={16} />
            Back Home
          </Link>
          <Link
            href="/sermons"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-white/5"
          >
            <ArrowLeft size={16} />
            Browse Sermons
          </Link>
        </div>
      </div>
    </main>
  );
}
