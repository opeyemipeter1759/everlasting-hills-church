'use client';
import React from 'react';
import { SidebarProvider } from '@/context/SidebarContext';
import { HeaderProvider } from '@/layout/Head';
import { ThemeProvider } from '@/context/ThemeContext';
import DashboardLayouts from '@/layout/DashboardLayouts';
import { GlobalAuthGuard } from '@/components/auth/GlobalAuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <GlobalAuthGuard>
      <SidebarProvider>
        <ThemeProvider>
          <HeaderProvider>
            <DashboardLayouts>{children}</DashboardLayouts>
          </HeaderProvider>
        </ThemeProvider>
      </SidebarProvider>
    </GlobalAuthGuard>
  );
}
