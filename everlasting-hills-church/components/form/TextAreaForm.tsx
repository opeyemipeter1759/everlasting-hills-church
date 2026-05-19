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
        <div className="flex items-center justify-between mb-1">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}

          {showCharCount && maxLength && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
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
            w-full text-sm rounded-lg px-3 py-3
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            border ${
              error
                ? "border-red-500 dark:border-red-400"
                : "border-gray-300 dark:border-gray-600"
            }
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600
            disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500
            resize-y
            transition-colors duration-200
          `}
        />

        {error && (
          <p
            id={errorId}
            className="text-red-500 dark:text-red-400 text-xs mt-1"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextAreaForm.displayName = "TextAreaForm";

export default TextAreaForm;