'use client';

import { useState, useEffect } from 'react';
import {
  getFrontendSessionUser,
  SESSION_CHANGED_EVENT,
  type FrontendSessionUser,
} from '@/lib/auth/frontend-session';

export function useCurrentUser(): FrontendSessionUser | null {
  const [currentUser, setCurrentUser] = useState<FrontendSessionUser | null>(null);

  useEffect(() => {
    setCurrentUser(getFrontendSessionUser());
    const refresh = () => setCurrentUser(getFrontendSessionUser());
    window.addEventListener(SESSION_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, refresh);
  }, []);

  return currentUser;
}
