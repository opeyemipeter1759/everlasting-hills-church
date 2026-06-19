"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import AuthSplitScreen from "@/components/auth/AuthSplitScreen";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { TextField } from "@/components/ui/form/TextField";

type FormValues = {
  email: string;
};

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async ({ email }: FormValues) => {
    setServerError("");
    try {
      await apiClient.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      const msg = (err as { message?: string }).message;
      setServerError(msg ?? "Could not send reset link. Please try again.");
    }
  };

  return (
    <AuthSplitScreen
      scripture="Cast thy burden upon the Lord, and he shall sustain thee."
      scriptureRef="Psalm 55:22"
      supportingCopy="Forgetting a password happens. Getting back in shouldn't be hard. Drop us your email and we'll send a fresh link."
    >
      <AuthDivider label="Password Reset" />

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-2">
        Forgot your password?
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8 max-w-sm mx-auto">
        Enter your email and we&apos;ll send a secure link to set a new one.
      </p>

      {sent ? (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-14 h-14 rounded-full bg-[#FFE8ED] flex items-center justify-center">
              <Mail size={24} className="text-[#87102C]" />
            </div>
            <div className="text-center max-w-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                If an account exists for that email, a reset link is on its way. The link
                expires after a short time — open it from the same browser when you can.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </div>
      ) : (
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

          <AuthErrorBanner message={serverError} />

          <AuthSubmitButton loading={isSubmitting} loadingText="Sending link…">
            Send Reset Link
          </AuthSubmitButton>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-[#87102C] transition-colors"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </form>
      )}
    </AuthSplitScreen>
  );
}
