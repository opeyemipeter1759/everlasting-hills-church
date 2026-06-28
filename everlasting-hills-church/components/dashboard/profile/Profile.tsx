'use client';

import { useState } from 'react';
import { User, Shield } from 'lucide-react';
import { GeneralTab } from './GeneralTab';
import { SecurityTab } from './SecurityTab';
import type { MeResponse } from '@/lib/api';

const NAV = [
  { id: 'general', label: 'My Profile', Icon: User },
  { id: 'security', label: 'Security', Icon: Shield },
] as const;

type TabId = 'general' | 'security';

export default function Profile({ data }: { data: MeResponse }) {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [loading, setLoading] = useState(false);

  const handleGeneralSave = async (formData: any) => {
    setLoading(true);
    try {
      console.log('Updating profile:', formData);
    } catch (e) {
      console.error('Error updating profile:', e);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen  dark:bg-[#0a0a0a] p-4 ">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-5 items-start">

        {/* ── Left Sidebar ──────────────────────────────────── */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
            <h2 className="text-[15px] font-bold text-gray-900 dark:text-white leading-tight">
              Settings
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-5">
              You can find all settings here.
            </p>

            <nav className="space-y-1">
              {NAV.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left
                    ${activeTab === id
                      ? 'bg-[#87102C] text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <GeneralTab profile={data} onSave={handleGeneralSave} />
          )}
          {activeTab === 'security' && (
            <SecurityTab />
          )}
        </main>

      </div>
    </div>
  );
}
