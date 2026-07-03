'use client';

import { useState } from 'react';
import { useSermonPlayer } from '@/context/SermonPlayerContext';
import SermonHero from './SermonHero';
import SermonBrowseGrid from './SermonBrowseGrid';

export default function SermonsPageClient() {
  const { play } = useSermonPlayer();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111]">
      <SermonHero onPlay={play} />

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <SermonBrowseGrid onPlay={play} />
        <EmailSubscribeCard />
      </div>
    </div>
  );
}

function EmailSubscribeCard() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    try {
      const { apiClient } = await import('@/lib/api/axios');
      await apiClient.post('/sermons/subscribers', { email });
      setState('done');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="bg-[#87102C] text-white rounded-2xl p-8 text-center space-y-4">
      <p className="text-sm font-bold uppercase tracking-widest text-white/60">Stay Connected</p>
      <h3 className="text-2xl font-black">Get new sermons in your inbox</h3>
      <p className="text-white/70 text-sm max-w-sm mx-auto">No account needed. Just your email — we'll notify you when a new message is published.</p>
      {state === 'done' ? (
        <p className="text-white font-semibold">You're subscribed!</p>
      ) : (
        <form onSubmit={subscribe} className="flex gap-2 max-w-sm mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm text-gray-900 focus:outline-none"
          />
          <button
            type="submit"
            disabled={state === 'loading'}
            className="px-5 py-2.5 rounded-xl bg-white text-[#87102C] font-bold text-sm hover:bg-gray-100 disabled:opacity-70 transition-all whitespace-nowrap"
          >
            {state === 'loading' ? '…' : 'Subscribe'}
          </button>
        </form>
      )}
      {state === 'error' && <p className="text-red-300 text-xs">Something went wrong. Please try again.</p>}
    </div>
  );
}
