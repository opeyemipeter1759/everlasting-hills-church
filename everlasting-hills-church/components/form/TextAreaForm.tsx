import { memo } from "react";
import type { UseFormRegister } from "react-hook-form";

type TextAreaFormProps = {
  label?: string;
  name: string;
  required?: boolean;
  register?: UseFormRegister<any>;
  error?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
};

const TextAreaForm = memo(
  ({
    label,
    name,
    required = false,
    register = () => ({} as any),
    error,
    placeholder,
    rows = 4,
    disabled = false,
    maxLength,
    showCharCount = false,
  }: TextAreaFormProps) => {
    const textareaId = `textarea-${name}`;
    const errorId = `${textareaId}-error`;

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-sm font-semibold text-gray-700 dark:text-gray-200"
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}

          {showCharCount && maxLength && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              0 / {maxLength}
            </span>
          )}
        </div>

        <textarea
          id={textareaId}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : undefined}
          {...(register as any)(name, {
            required: required
              ? `${label || "This field"} is required`
              : false,
            maxLength: maxLength
              ? {
                  value: maxLength,
                  message: `Maximum ${maxLength} characters allowed`,
                }
              : undefined,
          })}
          className={`
            w-full text-sm font-medium rounded-xl px-4 py-3
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            border-2 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${
              error
                ? "border-red-500 dark:border-red-400 focus:border-red-600 focus:ring-red-200/50 dark:focus:ring-red-900/50"
                : "border-gray-200 dark:border-gray-700 focus:border-burgundy focus:ring-burgundy/20 dark:focus:ring-burgundy/30"
            }
            disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500 disabled:opacity-60
            resize-none
          `}
        />

        {error && (
          <p
            id={errorId}
            className="text-red-600 dark:text-red-400 text-sm mt-2 flex items-center gap-1"
            role="alert"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18.101 12.93l-.9-1.572A6.986 6.986 0 0018 10a7 7 0 10-14 0c0 .113.011.226.027.338l-.9 1.572A.75.75 0 003.75 15h12.5a.75.75 0 00.851-.07zM12 13a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextAreaForm.displayName = "TextAreaForm";

export default TextAreaForm;