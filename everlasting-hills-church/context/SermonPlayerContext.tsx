'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import SermonPlayerBar from '@/components/sermons/watch/SermonPlayerBar';

type SermonPlayerCtx = {
  activeSlug: string | null;
  /** The series episode playing, when the active sermon is a series. */
  activeEpisodeId: string | null;
  /** Without an episode, a series starts from its first. */
  play: (slug: string, episodeId?: string) => void;
  close: () => void;
};

const SermonPlayerContext = createContext<SermonPlayerCtx | null>(null);

export function SermonPlayerProvider({ children }: { children: React.ReactNode }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);

  const play = useCallback((slug: string, episodeId?: string) => {
    setActiveSlug(slug);
    setActiveEpisodeId(episodeId ?? null);
  }, []);
  const close = useCallback(() => {
    setActiveSlug(null);
    setActiveEpisodeId(null);
  }, []);

  return (
    <SermonPlayerContext.Provider value={{ activeSlug, activeEpisodeId, play, close }}>
      <div style={activeSlug ? { paddingBottom: 84 } : undefined}>{children}</div>
      {activeSlug && (
        <SermonPlayerBar
          slug={activeSlug}
          episodeId={activeEpisodeId}
          onEpisodeChange={setActiveEpisodeId}
          onClose={close}
        />
      )}
    </SermonPlayerContext.Provider>
  );
}

export function useSermonPlayer() {
  const ctx = useContext(SermonPlayerContext);
  if (!ctx) throw new Error('useSermonPlayer must be used within a SermonPlayerProvider');
  return ctx;
}
