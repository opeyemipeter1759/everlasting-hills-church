"use client";

import { useForm } from "react-hook-form";
import { apiClient } from "@/lib/api/axios";

type QuestionFormValues = {
  name: string;
  email: string;
  message: string;
};

export default function QuestionForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<QuestionFormValues>();

  const onSubmit = async (data: QuestionFormValues) => {
    try {
      // POST /forms/contact — public endpoint, no auth needed
      await apiClient.post("/forms/contact", { ...data, subject: "Question from website" });
      reset();
    } catch (err) {
      throw new Error(
        (err as { message?: string }).message ?? "Failed to send. Please try again.",
      );
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="space-y-5 mt-5 flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-church-maroon/10 flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#87102C"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-white">Message received</h3>

        <p className="text-white/60 max-w-sm leading-relaxed">
          Your question has been received. We will get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 mt-10 text-gray-800 dark:text-gray-100">
      
      {/* HEADER (same style as Prayer/Testimony) */}
      <div className="mb-8 text-center mt-20">
        <h1 className="text-white text-3xl sm:text-4xl font-bold mb-2">
          Ask a Question
        </h1>

        <p className="text-white/70 text-sm">
          Feel free to ask Bible questions, life questions, or anything you need clarity on.
          We are here to help you grow.
        </p>
      </div>

      {/* FORM CARD */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white text-black border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm space-y-5"
      >
        {/* NAME + EMAIL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Name <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-church-maroon focus:outline-none"
              {...register("name", { required: "Name is required" })}
            />

            {errors.name && (
              <p className="text-red-500 text-sm mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Email <span className="text-red-500">*</span>
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-church-maroon focus:outline-none"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: "Invalid email address",
                },
              })}
            />

            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

      <div>
  <label className="block text-sm font-semibold text-black mb-2">
    What would you like to ask? <span className="text-red-500">*</span>
  </label>

  <textarea
    rows={6}
    placeholder="Type your question here..."
    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-church-maroon focus:outline-none resize-none"
    {...register("message", { required: "Message is required" })}
  />

  {errors.message && (
    <p className="text-red-500 text-sm mt-1">
      {errors.message.message}
    </p>
  )}
</div>
        {/* BUTTON (same as Prayer/Testimony system) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-church-maroon to-burgundy-light text-white font-semibold text-sm hover:from-burgundy-dark hover:to-church-maroon transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
        >
          {isSubmitting ? "Sending…" : "Submit Question"}
        </button>
      </form>
    </div>
  );
}