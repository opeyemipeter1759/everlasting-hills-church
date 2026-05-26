// context/HeaderContext.tsx
'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  type ReactElement,
} from 'react';

type PageTitleData = {
  title?: ReactElement;
  subtitle?: string;
  Icon?: ReactNode;
};

type HeaderContextType = {
  headerContent: ReactNode;
  setHeaderContent: (content: ReactNode) => void;
  pageTitle: PageTitleData;
  setPageTitle: (data: PageTitleData) => void;
};

const HeaderContext = createContext<HeaderContextType>({
  headerContent: null,
  setHeaderContent: () => {},
  pageTitle: {},
  setPageTitle: () => {},
});

export const HeaderProvider = ({ children }: { children: ReactNode }) => {
  const [headerContent, setHeaderContent] = useState<ReactNode>(null);
  const [pageTitle, setPageTitle] = useState<PageTitleData>({});
  return (
    <HeaderContext.Provider
      value={{ headerContent, setHeaderContent, pageTitle, setPageTitle }}
    >
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => useContext(HeaderContext);

export const HeaderSlot = ({ children }: { children: ReactNode }) => {
  const { setHeaderContent } = useHeader();

  useEffect(() => {
    setHeaderContent(children);
    return () => setHeaderContent(null);
  }, []);

  return null;
};

// ✅ The PageTitle slot component - use this from any page to set dynamic title
export const PageTitleSlot = ({ title, subtitle, Icon }: PageTitleData) => {
  const { setPageTitle } = useHeader();

  useEffect(() => {
    setPageTitle({ title, subtitle, Icon });
    return () => setPageTitle({});
  }, [title, subtitle, Icon]);

  return null;
};
