import { memo } from "react";
import { UseFormRegister, FieldValues, Path } from "react-hook-form";

type Option = {
  id: string;
  name: string;
};

type SelectFormProps<T extends FieldValues = FieldValues> = {
  label?: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: string;
  options?: Option[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

const SelectForm = <T extends FieldValues>({
  label,
  name,
  register,
  error,
  options = [],
  required = false,
  disabled = false,
  placeholder,
}: SelectFormProps<T>) => {
  const selectId = `select-${name}`;
  const errorId = `${selectId}-error`;

    return (
      <div>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            id={selectId}
            {...register(name, {
              required: required
                ? `${label || "This field"} is required`
                : false,
            })}
            disabled={disabled}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? errorId : undefined}
            className={`
              w-full text-sm font-medium rounded-xl px-4 py-3 pr-11
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100
              border-2 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${
                error
                  ? "border-red-500 dark:border-red-400 focus:border-red-600 focus:ring-red-200/50 dark:focus:ring-red-900/50"
                  : "border-gray-200 dark:border-gray-700 focus:border-burgundy focus:ring-burgundy/20 dark:focus:ring-burgundy/30"
              }
              disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60
              appearance-none
            `}
          >
            <option value="">
              {placeholder || `Select ${label || "option"}`}
            </option>

            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>

          {/* Arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className={`w-5 h-5 ${
                disabled
                  ? "text-gray-400 dark:text-gray-600"
                  : "text-gray-500 dark:text-gray-400"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

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

SelectForm.displayName = "SelectForm";

export default SelectForm;