export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type Attribute = "class" | `data-${string}`;

export interface ThemeProviderProps {
  children?: React.ReactNode;
  /** Default theme name (default: 'system') */
  defaultTheme?: Theme;
  /** Key used to store theme setting in localStorage (default: 'theme') */
  storageKey?: string;
  /** HTML attribute or class to modify based on active theme (default: 'data-theme') */
  attribute?: Attribute | Attribute[];
  /** Mapping of theme name to attribute value */
  value?: Record<string, string>;
  /** Forced theme (overrides system/stored preferences) */
  forcedTheme?: Theme;
  /** Disable all CSS transitions when switching themes (default: false) */
  disableTransitionOnChange?: boolean;
  /** Enable system theme preference detection (default: true) */
  enableSystem?: boolean;
  /** Enable CSS color-scheme property (default: true) */
  enableColorScheme?: boolean;
  /** List of available themes (default: ['light', 'dark']) */
  themes?: string[];
  /** Nonce for CSP */
  nonce?: string;
}

export interface UseThemeReturn {
  /** Current theme name */
  theme: Theme | undefined;
  /** Set theme */
  setTheme: (theme: Theme | ((theme: Theme) => Theme)) => void;
  /** Forced page theme or falsy */
  forcedTheme: Theme | undefined;
  /** Resolved theme name (actual 'light' or 'dark' when system preference is used) */
  resolvedTheme: ResolvedTheme | undefined;
  /** System theme preference ('light' or 'dark') */
  systemTheme: ResolvedTheme | undefined;
  /** List of available themes */
  themes: string[];
}
