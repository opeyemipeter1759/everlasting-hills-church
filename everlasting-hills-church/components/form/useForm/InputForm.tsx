"use client";

import { EyeCloseIcon, EyeIcon } from "@/components/icons";
import { memo, useState } from "react";
import {
  UseFormRegister,
  FieldValues,
  Path,
  RegisterOptions,
} from "react-hook-form";

type InputFormProps<T extends FieldValues> = {
  label?: string;
  name: Path<T>;
  type?: string;
  register: UseFormRegister<T>;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  validationRules?: RegisterOptions<T, Path<T>>;
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
  validationRules = {},
}: InputFormProps<T>) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === "password" && showPassword ? "text" : type;

  const rules = {
    required: required ? `${label || "This field"} is required` : false,
    ...validationRules,
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={String(name)}
          className="block mb-3 text-[15px] font-semibold text-black"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={String(name)}
          type={inputType}
          {...register(name, rules)}
          readOnly={disabled}
          disabled={disabled}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${String(name)}-error` : undefined}
          placeholder={placeholder}
          className={`
            w-full h-[56px] rounded-2xl px-5
            bg-[#EEF2FA]
            text-black
            placeholder:text-black
            text-[16px]
            font-medium
            border-none
            outline-none
            shadow-none
            transition-all duration-200
            focus:outline-none
            focus:ring-0
            focus:border-none
            ${disabled ? "opacity-60 cursor-not-allowed bg-gray-100" : ""}
            ${type === "password" ? "pr-14" : ""}
          `}
        />

        {type === "password" && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-[#4B5563] transition-colors"
          >
            {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
          </button>
        )}
      </div>

      {error && (
        <p
          id={`${String(name)}-error`}
          className="mt-2 text-sm text-red-600 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18.101 12.93l-.9-1.572A6.986 6.986 0 0018 10a7 7 0 10-14 0c0 .113.011.226.027.338l-.9 1.572A.75.75 0 003.75 15h12.5a.75.75 0 00.851-.07zM12 13a1 1 0 11-2 0 1 1 0 012 0z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

const InputForm = memo(InputFormComponent) as <T extends FieldValues>(
  props: InputFormProps<T>
) => JSX.Element;

export default InputForm;