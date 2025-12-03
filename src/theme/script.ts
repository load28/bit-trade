import type { Attribute } from "./types";

// This script runs before React hydration to prevent flash of wrong theme
export function getThemeScript({
  storageKey,
  attribute,
  defaultTheme,
  forcedTheme,
  enableSystem,
  enableColorScheme,
  value,
  themes,
  nonce,
}: {
  storageKey: string;
  attribute: Attribute | Attribute[];
  defaultTheme: string;
  forcedTheme?: string;
  enableSystem: boolean;
  enableColorScheme: boolean;
  value?: Record<string, string>;
  themes: string[];
  nonce?: string;
}) {
  const attrs = Array.isArray(attribute) ? attribute : [attribute];
  const attrsStr = JSON.stringify(attrs);
  const valueStr = value ? JSON.stringify(value) : "undefined";
  const themesStr = JSON.stringify(themes);

  // Minified inline script
  const script = `
(function(){
  var storageKey = ${JSON.stringify(storageKey)};
  var attrs = ${attrsStr};
  var value = ${valueStr};
  var themes = ${themesStr};
  var defaultTheme = ${JSON.stringify(defaultTheme)};
  var forcedTheme = ${forcedTheme ? JSON.stringify(forcedTheme) : "undefined"};
  var enableSystem = ${enableSystem};
  var enableColorScheme = ${enableColorScheme};

  function getTheme() {
    if (forcedTheme) return forcedTheme;
    try {
      var stored = localStorage.getItem(storageKey);
      if (stored && themes.includes(stored)) return stored;
    } catch (e) {}
    return defaultTheme;
  }

  function getResolvedTheme(theme) {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }

  var theme = getTheme();
  var resolved = getResolvedTheme(theme);
  var attrValue = value && value[resolved] ? value[resolved] : resolved;

  var d = document.documentElement;
  attrs.forEach(function(attr) {
    if (attr === 'class') {
      d.classList.remove('light', 'dark');
      d.classList.add(attrValue);
    } else {
      d.setAttribute(attr, attrValue);
    }
  });

  if (enableColorScheme) {
    d.style.colorScheme = resolved;
  }
})();
`;

  return { script: script.trim(), nonce };
}
