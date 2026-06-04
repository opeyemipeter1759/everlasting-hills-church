"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { auth } from "@/lib/api";
import AuthSplitScreen from "@/components/auth/AuthSplitScreen";

type FormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Dedicated flag so the spinner appears the instant the button is pressed and
  // stays up through the redirect. Unlike RHF's isSubmitting, it is not cleared
  // when auth.login resolves, avoiding a flash back to "Sign In" before the page
  // actually navigates. Only an error clears it.
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = async ({ email, password }: FormValues) => {
    setServerError("");
    setLoading(true);
    try {
      const resp = await auth.login({ email, password });
      const next = resp.user.needsPasswordChange ? "/change-password" : "/dashboard";
      window.location.assign(next);
      // Intentionally leave `loading` true — we are navigating away.
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : "An error occurred during login";
      setServerError(message);
      setLoading(false);
    }
  };

  return (
    <AuthSplitScreen>
      <div className="flex items-center justify-center mb-3">
        <span className="block w-6 h-px bg-[#87102C]/30" />
        <span className="px-3 text-[10px] tracking-[0.3em] uppercase text-[#87102C] font-bold">
          Member Portal
        </span>
        <span className="block w-6 h-px bg-[#87102C]/30" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-2">
        Welcome back
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Grow deeper in your commitment to God&apos;s house.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-2">
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
          <label htmlFor="password" className="block text-xs font-bold text-gray-700 mb-2">
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
            <p className="text-red-600 text-xs mt-1.5">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <p className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#87102C] to-[#a52242] text-white text-sm font-bold tracking-wide hover:from-[#6E0C24] hover:to-[#87102C] transition-all disabled:opacity-90 disabled:cursor-not-allowed shadow-lg shadow-[#87102C]/20 hover:shadow-xl hover:shadow-[#87102C]/30 hover:-translate-y-0.5 disabled:hover:translate-y-0 inline-flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            "Sign In"
          )}
        </button>

        <p className="text-center text-xs text-gray-500 mt-2">
          Can&apos;t remember your password?{" "}
          <Link href="/forgot-password" className="text-[#87102C] font-bold hover:underline">
            Forgot password
          </Link>
        </p>

        <p className="text-center text-[11px] text-gray-400 pt-3 border-t border-gray-100">
          First time logging in? Use your phone number as your password.
        </p>
      </form>
    </AuthSplitScreen>
  );
}
