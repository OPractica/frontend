import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";

export type ThemeMode = "light" | "dark";

const ORANGE = "#ff7900";
const STORAGE_KEY = "workplace-booking.theme.v1";

type ThemeApi = {
  mode: ThemeMode;
  isDark: boolean;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeApi | null>(null);

// Tema salvată; dacă nu există, aplicația pornește în tema deschisă
function readMode(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* fără acces la memoria browserului: tema deschisă */
  }
  return "light";
}

/**
 * Tema deschisă / închisă pentru tot site-ul.
 * - Ant Design primește algoritmul potrivit (butoane, tabele, ferestre, calendar);
 * - harta etajului își schimbă culorile după atributul data-theme de pe <html>.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(readMode);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* tema ține doar până la reîncărcare */
    }
  }, [mode]);

  const api: ThemeApi = {
    mode,
    isDark: mode === "dark",
    toggle: () => setMode((m) => (m === "dark" ? "light" : "dark")),
  };

  return (
    <ThemeContext.Provider value={api}>
      <ConfigProvider
        theme={{
          algorithm: mode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: { colorPrimary: ORANGE },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeApi {
  const api = useContext(ThemeContext);
  if (!api) throw new Error("useTheme must be used inside ThemeProvider");
  return api;
}
