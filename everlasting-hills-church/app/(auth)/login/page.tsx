"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { auth } from "@/lib/api";
import { getLandingPage } from "@/lib/auth/frontend-session";
import AuthSplitScreen from "@/components/auth/AuthSplitScreen";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { TextField } from "@/components/ui/form/TextField";
import { PasswordField } from "@/components/ui/form/PasswordField";
import { showToast } from "@/components/ui/toast/toast";

type FormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const next = resp.user.needsPasswordChange
        ? "/change-password"
        : getLandingPage(resp.user.role);
      window.location.assign(next);
      showToast.success("Login successful!");
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
      <AuthDivider label="Member Portal" />

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-2">
        Welcome back
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Grow deeper in your commitment to God&apos;s house.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <TextField
          label="Email Address"
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          required
          {...register("email", { required: "Email is required" })}
        />

        <PasswordField
          label="Password (Phone number)"
          id="password"
          showPassword={showPassword}
          onToggleShow={() => setShowPassword((v) => !v)}
          autoComplete="current-password"
          placeholder="••••••••••"
          error={errors.password?.message}
          required
          {...register("password", { required: "Password is required" })}
        />

        <AuthErrorBanner message={serverError} />

        <AuthSubmitButton loading={loading} loadingText="Signing in…">
          Sign In
        </AuthSubmitButton>

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
