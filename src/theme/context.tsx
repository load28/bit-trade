"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Attribute,
  ResolvedTheme,
  Theme,
  ThemeProviderProps,
  UseThemeReturn,
} from "./types";

const MEDIA = "(prefers-color-scheme: dark)";

const defaultContext: UseThemeReturn = {
  theme: undefined,
  setTheme: () => {},
  forcedTheme: undefined,
  resolvedTheme: undefined,
  systemTheme: undefined,
  themes: [],
};

const ThemeContext = createContext<UseThemeReturn>(defaultContext);

// Safe localStorage access
const getStoredTheme = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStoredTheme = (key: string, value: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage not available
  }
};

// Get system theme preference
const getSystemTheme = (e?: MediaQueryList | MediaQueryListEvent): ResolvedTheme => {
  if (typeof window === "undefined") return "light";
  const query = e ?? window.matchMedia(MEDIA);
  return query.matches ? "dark" : "light";
};

// Disable transitions temporarily
const disableTransitions = () => {
  const css = document.createElement("style");
  css.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}"
    )
  );
  document.head.appendChild(css);

  return () => {
    // Force a reflow before removing
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    window.getComputedStyle(document.body);
    // Use requestAnimationFrame to ensure the transition disable is applied
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.head.removeChild(css);
      });
    });
  };
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  attribute = "data-theme",
  value,
  forcedTheme,
  disableTransitionOnChange = false,
  enableSystem = true,
  enableColorScheme = true,
  themes = ["light", "dark"],
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme(storageKey);
    if (stored && themes.includes(stored)) {
      return stored as Theme;
    }
    return defaultTheme;
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme | undefined>(
    () => getSystemTheme()
  );

  const attrs = useMemo(
    () => (Array.isArray(attribute) ? attribute : [attribute]),
    [attribute]
  );

  // Apply theme to DOM
  const applyTheme = useCallback(
    (resolved: ResolvedTheme) => {
      const attrValue = value?.[resolved] ?? resolved;
      const d = document.documentElement;

      let enableTransition: (() => void) | undefined;
      if (disableTransitionOnChange) {
        enableTransition = disableTransitions();
      }

      attrs.forEach((attr: Attribute) => {
        if (attr === "class") {
          d.classList.remove("light", "dark");
          d.classList.add(attrValue);
        } else {
          d.setAttribute(attr, attrValue);
        }
      });

      if (enableColorScheme) {
        d.style.colorScheme = resolved;
      }

      enableTransition?.();
    },
    [attrs, disableTransitionOnChange, enableColorScheme, value]
  );

  // Handle theme changes
  const setTheme = useCallback(
    (newTheme: Theme | ((prev: Theme) => Theme)) => {
      const resolveTheme = typeof newTheme === "function" ? newTheme(theme) : newTheme;
      setThemeState(resolveTheme);
      setStoredTheme(storageKey, resolveTheme);

      // If theme is 'system', get actual system preference
      const actualTheme =
        resolveTheme === "system" ? getSystemTheme() : (resolveTheme as ResolvedTheme);
      setResolvedTheme(actualTheme);
      applyTheme(actualTheme);
    },
    [theme, storageKey, applyTheme]
  );

  // Listen for system theme changes
  useEffect(() => {
    if (!enableSystem) return;

    const mediaQuery = window.matchMedia(MEDIA);

    const handleChange = (e: MediaQueryListEvent) => {
      const systemTheme = getSystemTheme(e);
      if (theme === "system" || forcedTheme === "system") {
        setResolvedTheme(systemTheme);
        applyTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [enableSystem, theme, forcedTheme, applyTheme]);

  // Handle forced theme
  useEffect(() => {
    if (forcedTheme) {
      const resolved =
        forcedTheme === "system" ? getSystemTheme() : (forcedTheme as ResolvedTheme);
      setResolvedTheme(resolved);
      applyTheme(resolved);
    }
  }, [forcedTheme, applyTheme]);

  // Initial theme application
  useEffect(() => {
    const currentTheme = forcedTheme ?? theme;
    const resolved =
      currentTheme === "system" ? getSystemTheme() : (currentTheme as ResolvedTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const contextValue = useMemo<UseThemeReturn>(
    () => ({
      theme: forcedTheme ?? theme,
      setTheme,
      forcedTheme,
      resolvedTheme,
      systemTheme: getSystemTheme(),
      themes,
    }),
    [theme, setTheme, forcedTheme, resolvedTheme, themes]
  );

  return (
    <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): UseThemeReturn {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return defaultContext;
  }
  return context;
}
