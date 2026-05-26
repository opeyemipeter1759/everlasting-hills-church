'use client';
import React, { createContext, useContext, useState } from 'react';

interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  position: { left: number; top: number } | null;
  setPosition: (pos: { left: number; top: number } | null) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        showDropdown,
        setShowDropdown,
        searchTerm,
        setSearchTerm,
        position,
        setPosition,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
