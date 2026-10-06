import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { defaultTheme, isThemeName, themes, themeStorageKey, type ThemeName } from './theme.config';
import { applyTheme, createMuiTheme, readTheme } from './theme.utils';
import type { AppTheme } from './theme.types';

interface ThemeContextValue {
  theme: AppTheme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState(readTheme);
  useLayoutEffect(() => {
    applyTheme(themeName);
  }, [themeName]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === themeStorageKey || event.key === null) {
        setThemeName(isThemeName(event.newValue) ? event.newValue : defaultTheme);
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const value = useMemo<ThemeContextValue>(() => {
    const setTheme = (name: ThemeName) => {
      if (!isThemeName(name)) return;
      setThemeName(name);
      try {
        localStorage.setItem(themeStorageKey, name);
      } catch {
        /* Session-only when storage is unavailable. */
      }
    };
    return {
      theme: themes[themeName],
      themeName,
      setTheme,
      toggleTheme: () => {
        const names = Object.keys(themes) as ThemeName[];
        setTheme(names[(names.indexOf(themeName) + 1) % names.length]);
      },
    };
  }, [themeName]);
  const muiTheme = useMemo(() => createMuiTheme(value.theme), [value.theme]);
  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
