'use client';

import { useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  children: Record<string, React.ReactNode>;
  className?: string;
}

export function Tabs({ tabs, defaultTab, onChange, children, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className={className}>
      <div className="flex gap-2 border-b border-gray-200 dark:border-white/10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-6 py-3 text-sm font-semibold transition-all duration-200 flex items-center gap-2 relative ${
              activeTab === tab.id
                ? 'text-[#87102C] dark:text-[#FFB3C1]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#87102C] dark:bg-[#FFB3C1]" />
            )}
          </button>
        ))}
      </div>
      <div className="mt-6">{children[activeTab]}</div>
    </div>
  );
}
