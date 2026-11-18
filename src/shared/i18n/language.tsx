import { createContext, Fragment, useContext, useEffect, useState, type ReactNode } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ro";
import "dayjs/locale/ru";
import { ConfigProvider } from "antd";
import enUS from "antd/es/locale/en_US";
import roRO from "antd/es/locale/ro_RO";
import ruRU from "antd/es/locale/ru_RU";
import { DICTS, type Dict } from "./translations";

export type Lang = "ro" | "ru" | "en";

const STORAGE_KEY = "workplace-booking.language.v1";
const ANTD_LOCALES = { en: enUS, ro: roRO, ru: ruRU };

type LanguageApi = {
  lang: Lang;
  t: Dict;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageApi | null>(null);

// Limba salvată; dacă nu există, aplicația pornește în engleză
function readLang(): Lang {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "ro" || saved === "ru" || saved === "en") return saved;
  } catch {
    /* fără acces la memoria browserului: engleza */
  }
  return "en";
}

const INITIAL = readLang();
dayjs.locale(INITIAL);

/**
 * Limba interfeței pentru tot site-ul.
 * - textele noastre vin din DICTS (translations.ts);
 * - Ant Design primește limba lui (butoane OK/Cancel, tabele goale, calendar);
 * - dayjs scrie lunile și zilele în limba aleasă.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(INITIAL);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* limba ține doar până la reîncărcare */
    }
  }, [lang]);

  const setLang = (next: Lang) => {
    dayjs.locale(next);
    setLangState(next);
  };

  return (
    <LanguageContext.Provider value={{ lang, t: DICTS[lang], setLang }}>
      <ConfigProvider locale={ANTD_LOCALES[lang]}>
        {/* key={lang}: la schimbarea limbii pagina se reconstruiește, ca toate textele și datele să treacă pe noua limbă */}
        <Fragment key={lang}>{children}</Fragment>
      </ConfigProvider>
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage(): LanguageApi {
  const api = useContext(LanguageContext);
  if (!api) throw new Error("useLanguage must be used inside LanguageProvider");
  return api;
}