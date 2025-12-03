import { getThemeScript } from "./script";
import type { Attribute } from "./types";

interface ThemeScriptProps {
  storageKey?: string;
  attribute?: Attribute | Attribute[];
  defaultTheme?: string;
  forcedTheme?: string;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  value?: Record<string, string>;
  themes?: string[];
  nonce?: string;
}

export function ThemeScript({
  storageKey = "theme",
  attribute = "data-theme",
  defaultTheme = "system",
  forcedTheme,
  enableSystem = true,
  enableColorScheme = true,
  value,
  themes = ["light", "dark"],
  nonce,
}: ThemeScriptProps) {
  const { script } = getThemeScript({
    storageKey,
    attribute,
    defaultTheme,
    forcedTheme,
    enableSystem,
    enableColorScheme,
    value,
    themes,
    nonce,
  });

  return (
    <script
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
