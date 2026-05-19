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
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
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
              w-full text-sm rounded-lg px-3 py-2.5 pr-10
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100
              border ${
                error
                  ? "border-red-500 dark:border-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }
              focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600
              disabled:bg-gray-100 dark:disabled:bg-gray-900
              disabled:cursor-not-allowed disabled:text-gray-500
              appearance-none transition-colors duration-200
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
            className="text-red-500 dark:text-red-400 text-xs mt-1"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }

SelectForm.displayName = "SelectForm";

export default SelectForm;