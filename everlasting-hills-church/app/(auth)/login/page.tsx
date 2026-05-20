"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type FormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async ({ email, password }: FormValues) => {
    setServerError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setServerError(error.message);
      return;
    }
    router.push("/me");
    router.refresh();
  };

  return (
    <div className="py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-white/50 text-sm">
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
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-church-maroon/30 focus:border-church-maroon"
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
          <input
            type="password"
            autoComplete="current-password"
            {...register("password", { required: "Password is required" })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-church-maroon/30 focus:border-church-maroon"
            placeholder="••••••••"
          />
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
