import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  labelClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, id, error, className, labelClassName, required, ...inputProps }, ref) {
    return (
      <div>
        <label htmlFor={id} className={labelClassName ?? 'block text-xs font-bold text-gray-700 mb-2'}>
          {label}
          {required && <span className="text-[#87102C] ml-1">*</span>}
        </label>
        <input
          id={id}
          ref={ref}
          required={required}
          className={
            className ??
            'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C] focus:bg-white transition-colors'
          }
          {...inputProps}
        />
        {error && <p className="text-red-600 text-xs mt-1.5">{error}</p>}
      </div>
    );
  }
);
