"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ShieldCheck } from "lucide-react";
import { useChangePassword } from "@/lib/api";
import {
  getAccessTokenFromCookie,
  setFrontendSession,
} from "@/lib/auth/frontend-session";
import AuthSplitScreen from "@/components/auth/AuthSplitScreen";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { PasswordField } from "@/components/ui/form/PasswordField";

type FormValues = {
  password: string;
  confirm: string;
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [ready, setReady] = useState(false);
  const [flow, setFlow] = useState<"recovery" | "first-login" | null>(null);
  const { submit, isLoading, isError } = useChangePassword();

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
    setServerError(null);
    try {
      await submit(password);
      setSubmitted(true);
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
      <AuthDivider label="Secure Your Account" />

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
          <PasswordField
            label="New Password"
            id="password"
            showPassword={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            error={errors.password?.message}
            required
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "At least 6 characters" },
            })}
          />

          <PasswordField
            label="Confirm Password"
            id="confirm"
            showPassword={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
            autoComplete="new-password"
            placeholder="Repeat your new password"
            error={errors.confirm?.message}
            required
            {...register("confirm", {
              required: "Please confirm your password",
              validate: (v) => v === password || "Passwords do not match",
            })}
          />

          <AuthErrorBanner message={serverError ?? (isError ? "Could not update password. Please try again." : null)} />

          <AuthSubmitButton
            disabled={isSubmitting || isLoading || !ready}
            loading={isSubmitting || isLoading}
            loadingText="Updating…"
          >
            Update Password
          </AuthSubmitButton>
        </form>
      )}
    </AuthSplitScreen>
  );
}
