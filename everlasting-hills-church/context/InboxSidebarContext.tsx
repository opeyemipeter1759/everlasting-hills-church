'use client';

import { createContext, useContext } from 'react';

interface InboxSidebarContextType {
  isMobileOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

export const InboxSidebarContext = createContext<
  InboxSidebarContextType | undefined
>(undefined);

export const useInboxSidebar = () => {
  const context = useContext(InboxSidebarContext);
  if (!context) {
    throw new Error('useInboxSidebar must be used within InboxLayout');
  }
  return context;
};
