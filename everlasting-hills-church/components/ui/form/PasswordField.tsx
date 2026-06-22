'use client';

import { forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  showPassword: boolean;
  onToggleShow: () => void;
  error?: string;
  labelClassName?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(
    { label, id, showPassword, onToggleShow, error, className, labelClassName, required, ...inputProps },
    ref
  ) {
    return (
      <div>
        <label
          htmlFor={id}
          className={labelClassName ?? 'block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2'}
        >
          {label}
          {required && <span className="text-[#87102C] ml-1">*</span>}
        </label>
        <div className="relative">
          <input
            id={id}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            required={required}
            className={
              className ??
              'w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C] focus:bg-white transition-colors'
            }
            {...inputProps}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={onToggleShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#87102C] focus:outline-none p-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && <p className="text-red-600 text-xs mt-1.5">{error}</p>}
      </div>
    );
  }
);
