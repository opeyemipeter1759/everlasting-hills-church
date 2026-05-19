import { memo } from "react";
import { UseFormRegister, FieldValues, Path } from "react-hook-form";

type DateFormProps<T extends FieldValues = FieldValues> = {
  label?: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: string;
  required?: boolean;
  disabled?: boolean;
};

const DateForm = memo(
  <T extends FieldValues>({
    label,
    name,
    register,
    error,
    required = false,
    disabled = false,
  }: DateFormProps<T>) => {
    return (
      <div className="mb-4">
        {label && (
          <label
            htmlFor={name}
            className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}

        <input
          id={name}
          type="date"
          {...register(name, {
            required: required ? `${label ?? "This field"} is required` : false,
          })}
          disabled={disabled}
          className={`w-full text-xs font-light rounded-lg p-3 border focus:outline-gray-200 focus:outline transition ${
            error ? "border-red-500" : "border-gray-300"
          } ${
            disabled
              ? "bg-gray-100 cursor-not-allowed"
              : "bg-white dark:bg-gray-800 dark:text-gray-200"
          }`}
        />

        {error && (
          <p
            id={`${name}-error`}
            className="text-red-500 text-xs mt-px"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

DateForm.displayName = "DateForm";

export default DateForm;