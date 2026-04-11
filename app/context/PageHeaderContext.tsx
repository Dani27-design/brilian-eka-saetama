"use client";

import { createContext, useContext, useState, useCallback, useLayoutEffect } from "react";

interface PageHeaderState {
  title: string;
  subtitle: string;
}

interface PageHeaderContextType {
  header: PageHeaderState;
  setPageHeader: (title: string, subtitle?: string) => void;
}

const PageHeaderContext = createContext<PageHeaderContextType>({
  header: { title: "", subtitle: "" },
  setPageHeader: () => {},
});

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeader] = useState<PageHeaderState>({ title: "", subtitle: "" });

  const setPageHeader = useCallback((title: string, subtitle?: string) => {
    setHeader({ title, subtitle: subtitle || "" });
  }, []);

  return (
    <PageHeaderContext.Provider value={{ header, setPageHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader(title: string, subtitle?: string) {
  const { setPageHeader } = useContext(PageHeaderContext);

  // useLayoutEffect runs synchronously before paint, ensuring the header
  // is set immediately when the page component mounts
  useLayoutEffect(() => {
    setPageHeader(title, subtitle);
  }, [title, subtitle, setPageHeader]);
}

export function usePageHeaderValue() {
  const { header } = useContext(PageHeaderContext);
  return header;
}
