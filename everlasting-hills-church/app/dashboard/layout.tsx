'use client';
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { SidebarProvider } from '@/context/SidebarContext';
import { HeaderProvider } from '@/layout/Head';
import { ThemeProvider } from '@/context/ThemeContext';
import DashboardLayouts from '@/layout/DashboardLayouts';
import { GlobalAuthGuard } from '@/components/auth/GlobalAuthGuard';

/**
 * The sermon player (SermonPlayerProvider) is mounted once at the app root (app/layout.tsx),
 * not here — a provider scoped to just the dashboard would unmount (killing playback) the
 * moment a visitor navigates to the public site, and vice versa.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <GlobalAuthGuard>
      <SidebarProvider>
        <ThemeProvider>
          <HeaderProvider>
            <DashboardLayouts>{children}</DashboardLayouts>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: { fontSize: '13px', fontWeight: 600, borderRadius: '10px' },
                success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
          </HeaderProvider>
        </ThemeProvider>
      </SidebarProvider>
    </GlobalAuthGuard>
  );
}
