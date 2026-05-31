"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import {
  getAccessTokenFromCookie,
  setFrontendSession,
} from "@/lib/auth/frontend-session";
import AuthSplitScreen from "@/components/auth/AuthSplitScreen";

type FormValues = {
  password: string;
  confirm: string;
};

/**
 * Change-password handles two entry paths:
 *   A) Logged-in member changing their own password (session cookie already present).
 *   B) User arriving via Supabase recovery email — URL hash carries `#access_token=…&type=recovery`.
 *      We bridge that into our cookie jar so apiClient sends it as the Bearer token.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [ready, setReady] = useState(false);
  // "recovery" = arrived via Supabase reset email; "first-login" = forced change after
  // signing in with the temp (phone-number) password; null until we figure it out.
  const [flow, setFlow] = useState<"recovery" | "first-login" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const existing = getAccessTokenFromCookie();
    const hash = window.location.hash;
    const hasRecoveryHash = hash.includes("access_token") && hash.includes("type=recovery");

    if (hasRecoveryHash) {
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const accessToken = params.get("access_token");
      const expiresIn = Number(params.get("expires_in") ?? "3600");
      if (accessToken) {
        setFrontendSession({
          accessToken,
          email: "",
          role: null,
          expiresInSeconds: expiresIn,
        });
        window.history.replaceState(null, "", window.location.pathname);
      }
      setFlow("recovery");
    } else if (existing) {
      setFlow("first-login");
    }
    setReady(true);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const password = watch("password");

  const onSubmit = async ({ password }: FormValues) => {
    setServerError("");
    try {
      await apiClient.post("/auth/change-password", { password });
      setSubmitted(true);
      // Recovery flow: the bridged session has no role/email, so send them to /login.
      // First-login flow: existing session is still valid, push them straight into the app.
      const next = flow === "first-login" ? "/dashboard" : "/login";
      setTimeout(() => router.replace(next), 1500);
    } catch (err) {
      const msg = (err as { message?: string }).message;
      setServerError(msg ?? "Could not update password. Please try again.");
    }
  };

  return (
    <AuthSplitScreen
      scripture="He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake."
      scriptureRef="Psalm 23:3"
      supportingCopy="A new password is a small thing, but it is a step in the right direction. Choose something only you would know."
    >
      <div className="flex items-center justify-center mb-3">
        <span className="block w-6 h-px bg-[#87102C]/30" />
        <span className="px-3 text-[10px] tracking-[0.3em] uppercase text-[#87102C] font-bold">
          Secure Your Account
        </span>
        <span className="block w-6 h-px bg-[#87102C]/30" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-2">
        Set a new password
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8 max-w-sm mx-auto">
        Pick a password you&apos;ll remember. Six characters minimum — longer is stronger.
      </p>

      {submitted ? (
        <div className="space-y-5 text-center py-6">
          <div className="w-14 h-14 rounded-full bg-[#FFE8ED] flex items-center justify-center mx-auto">
            <ShieldCheck size={24} className="text-[#87102C]" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Password updated</h2>
          <p className="text-sm text-gray-500">
            Redirecting you to sign in with your new password…
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-gray-700 mb-2">
              New Password <span className="text-[#87102C]">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "At least 6 characters" },
                })}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C] focus:bg-white transition-colors"
                placeholder="At least 6 characters"
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

          <div>
            <label htmlFor="confirm" className="block text-xs font-bold text-gray-700 mb-2">
              Confirm Password <span className="text-[#87102C]">*</span>
            </label>
            <input
              id="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...register("confirm", {
                required: "Please confirm your password",
                validate: (v) => v === password || "Passwords do not match",
              })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C] focus:bg-white transition-colors"
              placeholder="Repeat your new password"
            />
            {errors.confirm && (
              <p className="text-red-600 text-xs mt-1.5">{errors.confirm.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !ready}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#87102C] to-[#a52242] text-white text-sm font-bold tracking-wide hover:from-[#6E0C24] hover:to-[#87102C] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#87102C]/20 hover:shadow-xl hover:shadow-[#87102C]/30 hover:-translate-y-0.5"
          >
            {isSubmitting ? "Updating…" : "Update Password"}
          </button>
        </form>
      )}
    </AuthSplitScreen>
  );
}
