'use client';

import React from 'react';

function Bone({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700/60 ${className}`}
    />
  );
}

interface SidebarSkeletonProps {
  showLabels?: boolean;
}

const GROUP_ONE_WIDTHS = ['w-24', 'w-20', 'w-28', 'w-16', 'w-24'];
const GROUP_TWO_WIDTHS = ['w-28', 'w-20', 'w-24'];

export function SidebarSkeleton({ showLabels = true }: SidebarSkeletonProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-gray-200 px-3 py-[14px] dark:border-gray-800">
        <Bone className="h-8 w-8 shrink-0 rounded-lg" />
        {showLabels && (
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <Bone className="h-3 w-28" />
            <Bone className="h-2 w-20" />
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-hidden px-2 py-3 space-y-5">
        <div className="space-y-0.5">
          {showLabels && <Bone className="h-2 w-16 mb-2 mx-2.5" />}
          {GROUP_ONE_WIDTHS.map((w, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-2.5 py-2">
              <Bone className="h-7 w-7 shrink-0 rounded-lg" />
              {showLabels && <Bone className={`h-3 ${w}`} />}
            </div>
          ))}
        </div>

        <div className="space-y-0.5">
          {showLabels && <Bone className="h-2 w-20 mb-2 mx-2.5" />}
          {GROUP_TWO_WIDTHS.map((w, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-2.5 py-2">
              <Bone className="h-7 w-7 shrink-0 rounded-lg" />
              {showLabels && <Bone className={`h-3 ${w}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* User profile */}
      <div className="shrink-0 border-t border-gray-100 p-2 dark:border-gray-800">
        <div
          className={`flex items-center rounded-xl py-2 ${
            showLabels ? 'gap-3 px-2' : 'justify-center px-1'
          }`}
        >
          <Bone className="h-8 w-8 shrink-0 rounded-full" />
          {showLabels && (
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <Bone className="h-3 w-24" />
              <Bone className="h-2 w-32" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
