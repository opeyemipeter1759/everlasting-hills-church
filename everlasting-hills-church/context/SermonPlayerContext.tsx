'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import SermonPlayerBar from '@/components/sermons/watch/SermonPlayerBar';

type SermonPlayerCtx = {
  activeSlug: string | null;
  play: (slug: string) => void;
  close: () => void;
};

const SermonPlayerContext = createContext<SermonPlayerCtx | null>(null);

export function SermonPlayerProvider({ children }: { children: React.ReactNode }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const play = useCallback((slug: string) => setActiveSlug(slug), []);
  const close = useCallback(() => setActiveSlug(null), []);

  return (
    <SermonPlayerContext.Provider value={{ activeSlug, play, close }}>
      <div style={activeSlug ? { paddingBottom: 84 } : undefined}>{children}</div>
      {activeSlug && <SermonPlayerBar slug={activeSlug} onClose={close} />}
    </SermonPlayerContext.Provider>
  );
}

export function useSermonPlayer() {
  const ctx = useContext(SermonPlayerContext);
  if (!ctx) throw new Error('useSermonPlayer must be used within a SermonPlayerProvider');
  return ctx;
}
