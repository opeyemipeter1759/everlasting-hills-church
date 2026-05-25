"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeCloseIcon } from "@/components/icons";
import { auth } from "@/lib/api";

type FormValues = {
  email: string;
  password: string;
};

/**
 * Login screen.
 *
 * Session management is delegated entirely to `auth.login()` in lib/api.ts —
 * it persists the real Supabase JWT and role hints into a single cookie set.
 * The page is responsible only for capturing input and routing on success.
 */
export default function LoginPage() {
  const router = useRouter();
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
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : "An error occurred during login";
      setServerError(message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-white text-sm">
          First time logging in? Use your phone number as your password.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email address
          </label>
          <input
            type="email"
            autoComplete="email"
            {...register("email", { required: "Email is required" })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-black focus:outline-none focus:ring-2 focus:ring-church-maroon/30 focus:border-church-maroon"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              {...register("password", { required: "Password is required" })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-black focus:outline-none focus:ring-2 focus:ring-church-maroon/30 focus:border-church-maroon pr-12"
              placeholder="••••••••"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-church-maroon focus:outline-none z-20"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeCloseIcon width={26} height={26} /> : <EyeIcon width={26} height={26} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-full bg-church-maroon text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-center text-sm text-gray-400">
          Accounts are created by the church admin after your first visit.
        </p>
      </form>
    </div>
  );
}
