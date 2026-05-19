"use client";

import { EyeCloseIcon, EyeIcon } from "@/components/icons";
import { memo, useState } from "react";
import { UseFormRegister, FieldValues, Path } from "react-hook-form";

type InputFormProps<T extends FieldValues> = {
  label?: string;
  name: Path<T>;
  type?: string;
  register: UseFormRegister<T>;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

function InputFormComponent<T extends FieldValues>({
  label,
  name,
  type = "text",
  register,
  error,
  placeholder,
  required = false,
  disabled = false,
}: InputFormProps<T>) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={String(name)}
          className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={String(name)}
          type={inputType}
          {...register(name, {
            required: required ? `${label || "This field"} is required` : false,
          })}
          readOnly={disabled}
          disabled={disabled}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${String(name)}-error` : undefined}
          className={`
            w-full text-sm rounded-lg px-4 py-2.5
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            border focus:outline-none focus:ring-1
            ${
              error
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-200"
            }
            ${disabled ? "opacity-60 cursor-not-allowed" : ""}
            ${type === "password" ? "pr-11" : ""}
          `}
          placeholder={placeholder}
        />

        {type === "password" && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
          </button>
        )}
      </div>

      {error && (
        <p
          id={`${String(name)}-error`}
          className="mt-1 text-xs text-red-500"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ✅ IMPORTANT: fix memo typing
const InputForm = memo(InputFormComponent) as <T extends FieldValues>(
  props: InputFormProps<T>
) => JSX.Element;

export default InputForm;