import { createContext, useContext, useState, type ReactNode } from "react";
import { t as translate, type Lang } from "@contracts/i18n";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: "zh",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    typeof localStorage !== "undefined" && localStorage.getItem("mrt-lang") === "en" ? "en" : "zh",
  );

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("mrt-lang", l);
  };

  const t = (key: string, params?: Record<string, string>) => translate(lang, key, params);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
