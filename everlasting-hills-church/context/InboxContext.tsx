'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface InboxContextType {
  starredMessages: Set<string>;
  toggleStar: (messageId: string) => void;
}

const InboxContext = createContext<InboxContextType | undefined>(undefined);

export const useInbox = () => {
  const context = useContext(InboxContext);
  if (!context) {
    throw new Error('useInbox must be used within an InboxProvider');
  }
  return context;
};

export const InboxProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [starredMessages, setStarredMessages] = useState<Set<string>>(new Set());

  // Load starred messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('starredMessages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStarredMessages(new Set(parsed));
      } catch (e) {
        console.error('Error loading starred messages:', e);
        // Initialize with default starred messages from data
        setStarredMessages(new Set(['2', '3']));
      }
    } else {
      // Initialize with default starred messages from data
      setStarredMessages(new Set(['2', '3']));
    }
  }, []);

  // Save starred messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      'starredMessages',
      JSON.stringify(Array.from(starredMessages))
    );
  }, [starredMessages]);

  const toggleStar = (messageId: string) => {
    setStarredMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  return (
    <InboxContext.Provider value={{ starredMessages, toggleStar }}>
      {children}
    </InboxContext.Provider>
  );
};
