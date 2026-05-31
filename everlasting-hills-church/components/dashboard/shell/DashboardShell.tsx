"use client";

import { useState } from "react";
import type { UserRole } from "./role-utils";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileBottomNav from "./MobileBottomNav";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
};

type Props = {
  user: SessionUser;
  children: React.ReactNode;
};

export default function DashboardShell({ user, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0810] transition-colors">
      <Sidebar
        user={user}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Content area — offset by sidebar width on desktop */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        <TopBar user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      <MobileBottomNav user={user} />
    </div>
  );
}
