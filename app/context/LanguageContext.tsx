"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getCookie, setCookie } from "cookies-next";

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({
  children,
  initialLanguage = "id",
}: {
  children: ReactNode;
  initialLanguage?: string;
}) {
  const router = useRouter();
  // Menggunakan initialLanguage untuk menghindari hydration mismatch
  const [language, setLanguageState] = useState<string>(initialLanguage);
  const [isClient, setIsClient] = useState(false);

  // Tandai bahwa kode berjalan di client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Inisialisasi bahasa dari cookie hanya setelah komponen di-mount
  useEffect(() => {
    if (isClient) {
      const savedLanguage = getCookie("NEXT_LOCALE");
      if (savedLanguage) {
        setLanguageState(savedLanguage.toString());
      }
    }
  }, [isClient]);

  // Fungsi untuk mengubah bahasa dan menyimpan ke cookie
  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    setCookie("NEXT_LOCALE", lang, { maxAge: 60 * 60 * 24 * 30 }); // 30 hari

    // Refresh server components to use the new language cookie
    router.refresh();
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
