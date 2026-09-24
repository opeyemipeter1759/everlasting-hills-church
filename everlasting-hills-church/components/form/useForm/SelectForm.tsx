"use client";

import { useState } from "react";
import { UseFormRegister, FieldValues, Path } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Select } from "@/components/ui/select";

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

/**
 * A react-hook-form field that uses the app's own dropdown rather than the
 * browser's. The form still owns the value: choosing one hands RHF the same
 * shape a native change event would, so validation and submission are unchanged.
 */
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
  const [value, setValue] = useState("");

  const field = register(name, {
    required: required ? `${label || "This field"} is required` : false,
  });

  function choose(next: string) {
    setValue(next);
    void field.onChange({ target: { name, value: next }, type: "change" });
  }

  return (
    <div>
      {label && (
        <label htmlFor={selectId} className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <Select
        id={selectId}
        value={value}
        onChange={choose}
        disabled={disabled}
        placeholder={placeholder || `Select ${label || "option"}`}
        options={options.map((opt) => ({ value: opt.id, label: opt.name }))}
        className={[
          "w-full rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200",
          "bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100",
          error
            ? "border-red-500 dark:border-red-400"
            : "border-gray-200 dark:border-gray-700",
          disabled ? "bg-gray-100 dark:bg-gray-900" : "",
        ].join(" ")}
      />

      {error && (
        <p id={errorId} role="alert" className="mt-2 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={15} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
};

SelectForm.displayName = "SelectForm";

export default SelectForm;
