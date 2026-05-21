"use client";

import { useForm } from "react-hook-form";
import Button from "@/components/ui/Button";
import TextAreaForm from "@/components/form/TextAreaForm";

type QuestionFormValues = {
  name: string;
  email: string;
  message: string;
};

const inputClass = (hasError: boolean) =>
  `w-full text-sm font-medium rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
    hasError
      ? "border-red-500 dark:border-red-400 focus:border-red-600 focus:ring-red-200/50"
      : "border-gray-200 dark:border-gray-700 focus:border-burgundy focus:ring-burgundy/20"
  }`;

export default function QuestionForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<QuestionFormValues>();

  const onSubmit = async (data: QuestionFormValues) => {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error ?? "Failed to send. Please try again.");
    }
    reset();
  };

  if (isSubmitSuccessful) {
    return (
      <div className="space-y-5 mt-5 text-gray-800 dark:text-gray-100">
        <h3 className="text-[24px] font-bold text-[#24244e] dark:text-gray-100">
          Thank you!
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Your question has been received. We will get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 mt-5 text-gray-800 dark:text-gray-100">
      <h3 className="text-[24px] font-bold text-[#24244e] dark:text-gray-100">
        Dear Friend
      </h3>

      <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
        Feel free to ask as many questions as you have — Bible questions, life
        questions, or anything you haven’t gotten answers to. Just ask them all.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm space-y-4"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Your name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="John Doe"
            className={inputClass(!!errors.name)}
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className={inputClass(!!errors.email)}
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email address" },
            })}
          />
          {errors.email && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <TextAreaForm
          label="What are your questions?"
          name="message"
          register={register}
          rows={6}
          required
          placeholder="Type your questions here..."
          error={errors.message?.message}
        />

        <Button
          className="mt-2 w-full md:w-auto"
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Submit"}
        </Button>
      </form>
    </div>
  );
}