'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useChangePassword } from '@/lib/api';
import { PasswordField } from '@/components/ui/form/PasswordField';
import { showToast } from '@/components/ui/toast/toast';

export function SecurityTab() {
  const { submit, isLoading, isError } = useChangePassword();
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    setValidationError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccess(false);

    if (passwords.new.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setValidationError('Passwords do not match');
      return;
    }

    try {
      await submit(passwords.new);
      setSuccess(true);
      showToast.success("Password changed successfully!");
      setPasswords({ new: '', confirm: '' });
    } catch {
      // isError from the hook handles display
    }
  };

  return (
    <div className="max-w-lg">
      <div className="mb-6 p-4 bg-[#87102C]/10 dark:bg-[#FFB3C1]/10 rounded-lg border border-[#87102C]/20 dark:border-[#FFB3C1]/20">
        <div className="flex gap-3">
          <Lock size={20} className="text-[#87102C] dark:text-[#FFB3C1] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Keep Your Account Secure</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Use a strong password with at least 6 characters, numbers, and symbols.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField
          label="New Password"
          id="new"
          name="new"
          value={passwords.new}
          onChange={handleChange}
          showPassword={showPasswords.new}
          onToggleShow={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
          labelClassName="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#87102C]/50 transition-all"
          required
        />

        <PasswordField
          label="Confirm Password"
          id="confirm"
          name="confirm"
          value={passwords.confirm}
          onChange={handleChange}
          showPassword={showPasswords.confirm}
          onToggleShow={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
          labelClassName="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#87102C]/50 transition-all"
          required
        />

        {validationError && (
          <p className="p-3 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300">
            {validationError}
          </p>
        )}

        {isError && !validationError && (
          <p className="p-3 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300">
            Could not update password. Please try again.
          </p>
        )}

        {success && (
          <p className="p-3 rounded-lg text-sm font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300">
            Password changed successfully.
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading || !passwords.new || !passwords.confirm}
          className="w-full px-4 py-3 bg-[#87102C] dark:bg-[#FFB3C1] text-white dark:text-[#111111] font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Updating...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

