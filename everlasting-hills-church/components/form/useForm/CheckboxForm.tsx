import { memo } from "react";
import { UseFormRegister, FieldValues, Path } from "react-hook-form";

type CheckboxFormProps<T extends FieldValues = FieldValues> = {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: string;
};

const CheckboxForm = <T extends FieldValues>({
  label,
  name,
  register,
  error,
}: CheckboxFormProps<T>) => {
    return (
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id={name}
          {...register(name)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-400 dark:border-gray-600"
        />

        <label
          htmlFor={name}
          className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>

        {error && (
          <p className="text-red-500 text-xs mt-[1px]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

CheckboxForm.displayName = "CheckboxForm";

export default CheckboxForm;