"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/api";

type FormValues = {
  email: string;
  password: string;
};

/**
 * Login screen — split-screen layout.
 *
 * LEFT panel (dark, branded):
 *   - Church logo + name
 *   - Featured scripture verse
 *   - Supporting copy
 *   - Trust badge ("Love, Family and Kingdom")
 *   - Secured footer
 *
 * RIGHT panel (white card):
 *   - "Member Portal" label
 *   - "Welcome back" heading
 *   - Email + password fields with inline show/hide toggle
 *   - Sign in button
 *   - Forgot password link
 *
 * Session management is delegated to `auth.login()` — it persists the Supabase JWT
 * + role hint cookies. After success we hard-navigate so middleware re-evaluates
 * the new cookies on the next request.
 */
export default function LoginPage() {
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async ({ email, password }: FormValues) => {
    setServerError("");
    try {
      await auth.login({ email, password });
      window.location.assign("/dashboard");
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : "An error occurred during login";
      setServerError(message);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 rounded-3xl overflow-hidden bg-white shadow-2xl ring-1 ring-black/5">
      {/* ── LEFT: dark branded panel ──────────────────────────────────────── */}
      <aside className="relative hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-[#87102C] via-[#6E0C24] to-[#4a081a] text-white overflow-hidden">
        {/* Subtle background accents */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        {/* Top: logo */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <Image
              src="/logo.png"
              alt="Everlasting Hills"
              width={56}
              height={56}
              className="object-contain flex-shrink-0"
            />
            <div className="leading-tight">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/60 font-semibold">
                Everlasting Hills
              </p>
              <p className="text-base font-bold tracking-wide">Community Church</p>
            </div>
          </div>
        </div>

        {/* Middle: scripture + message */}
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-2">
            <span className="block w-6 h-px bg-amber-300/80" />
            <span className="block w-1.5 h-1.5 rounded-full bg-amber-300/80" />
            <span className="block w-6 h-px bg-amber-300/80" />
          </div>
          <blockquote className="text-2xl font-serif leading-snug mt-4">
            &ldquo;For where two or three gather in my name, there am I with them.&rdquo;
          </blockquote>
          <p className="mt-3 text-[10px] tracking-[0.3em] uppercase text-amber-300/90 font-bold">
            Matthew 18:20
          </p>
          <p className="mt-6 text-sm text-white/70 leading-relaxed max-w-sm">
            Propagating and normalizing Kingdom Culture in our closely-knit community
            of believers in Ibadan.
          </p>
        </div>

        {/* Bottom: trust badge + secured */}
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2.5 rounded-full bg-white/8 border border-white/15 px-4 py-2 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-amber-300" />
            <span className="text-xs font-bold tracking-wide">
              Love, Family and Kingdom
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/40">
            <span>© 2026 Everlasting Hills, Ibadan</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={12} />
              Secured
            </span>
          </div>
        </div>
      </aside>

      {/* ── RIGHT: form panel ─────────────────────────────────────────────── */}
      <section className="bg-white p-8 sm:p-12 flex flex-col justify-center">
        {/* Logo (mobile-only — desktop has it in the left panel) */}
        <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
          <Image
            src="/logoblack.png"
            alt="Everlasting Hills"
            width={48}
            height={48}
            className="object-contain"
          />
          <div className="leading-tight">
            <p className="text-[10px] tracking-[0.3em] uppercase text-gray-500 font-semibold">
              Everlasting Hills
            </p>
            <p className="text-sm font-bold text-gray-900">Community Church</p>
          </div>
        </div>

        {/* Section label */}
        <div className="flex items-center justify-center mb-3">
          <span className="block w-6 h-px bg-[#87102C]/30" />
          <span className="px-3 text-[10px] tracking-[0.3em] uppercase text-[#87102C] font-bold">
            Member Portal
          </span>
          <span className="block w-6 h-px bg-[#87102C]/30" />
        </div>

        {/* Headings */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-2">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Grow deeper in your commitment to God&apos;s house.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-gray-700 mb-2"
            >
              Email Address <span className="text-[#87102C]">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email", { required: "Email is required" })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C] focus:bg-white transition-colors"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1.5">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-gray-700 mb-2"
            >
              Password (Phone number) <span className="text-[#87102C]">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password", { required: "Password is required" })}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C] focus:bg-white transition-colors"
                placeholder="••••••••••"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#87102C] focus:outline-none p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-600 text-xs mt-1.5">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#87102C] to-[#a52242] text-white text-sm font-bold tracking-wide hover:from-[#6E0C24] hover:to-[#87102C] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#87102C]/20 hover:shadow-xl hover:shadow-[#87102C]/30 hover:-translate-y-0.5"
          >
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>

          <p className="text-center text-xs text-gray-500 mt-2">
            Can&apos;t remember your password?{" "}
            <Link
              href="/change-password"
              className="text-[#87102C] font-bold hover:underline"
            >
              Forgot password
            </Link>
          </p>

          <p className="text-center text-[11px] text-gray-400 pt-3 border-t border-gray-100">
            First time logging in? Use your phone number as your password.
          </p>
        </form>
      </section>
    </div>
  );
}
