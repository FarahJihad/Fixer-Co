import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const LanguageContext =
  createContext();

export function LanguageProvider({
  children,
}) {
  const [language, setLanguage] =
    useState(() => {
      return (
        localStorage.getItem(
          "fixer-language"
        ) || "en"
      );
    });

  const isArabic =
    language === "ar";

  function toggleLanguage() {
    setLanguage((current) =>
      current === "en"
        ? "ar"
        : "en"
    );
  }

  useEffect(() => {
    localStorage.setItem(
      "fixer-language",
      language
    );

    document.documentElement.lang =
      language;

    document.documentElement.dir =
      isArabic ? "rtl" : "ltr";

  }, [language, isArabic]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isArabic,
        toggleLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(
    LanguageContext
  );
}