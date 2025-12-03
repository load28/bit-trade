import {
  createGlobalTheme,
  createThemeContract,
  globalStyle,
} from "@vanilla-extract/css";
import { baseLayer } from "./layers.css";

/**
 * Theme Contract - defines the shape of theme variables
 * All themes must implement these variables
 */
export const themeVars = createThemeContract({
  color: {
    background: null,
    foreground: null,
    primary: null,
    primaryForeground: null,
    secondary: null,
    secondaryForeground: null,
    muted: null,
    mutedForeground: null,
    accent: null,
    accentForeground: null,
    border: null,
    input: null,
    ring: null,
  },
  font: {
    sans: null,
    mono: null,
  },
  radius: {
    sm: null,
    md: null,
    lg: null,
    xl: null,
    full: null,
  },
  spacing: {
    xs: null,
    sm: null,
    md: null,
    lg: null,
    xl: null,
  },
});

/**
 * Light Theme (default)
 */
createGlobalTheme(":root, [data-theme='light']", themeVars, {
  color: {
    background: "#ffffff",
    foreground: "#171717",
    primary: "#171717",
    primaryForeground: "#ffffff",
    secondary: "#f5f5f5",
    secondaryForeground: "#171717",
    muted: "#f5f5f5",
    mutedForeground: "#737373",
    accent: "#f5f5f5",
    accentForeground: "#171717",
    border: "#e5e5e5",
    input: "#e5e5e5",
    ring: "#171717",
  },
  font: {
    sans: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
    mono: "var(--font-geist-mono), monospace",
  },
  radius: {
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    full: "9999px",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
});

/**
 * Dark Theme
 */
createGlobalTheme("[data-theme='dark']", themeVars, {
  color: {
    background: "#0a0a0a",
    foreground: "#ededed",
    primary: "#ededed",
    primaryForeground: "#171717",
    secondary: "#262626",
    secondaryForeground: "#ededed",
    muted: "#262626",
    mutedForeground: "#a3a3a3",
    accent: "#262626",
    accentForeground: "#ededed",
    border: "#262626",
    input: "#262626",
    ring: "#d4d4d4",
  },
  font: {
    sans: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
    mono: "var(--font-geist-mono), monospace",
  },
  radius: {
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    full: "9999px",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
});

/**
 * Global base styles in the base layer
 */
globalStyle("html", {
  "@layer": {
    [baseLayer]: {
      colorScheme: "light dark",
    },
  },
});

globalStyle("body", {
  "@layer": {
    [baseLayer]: {
      background: themeVars.color.background,
      color: themeVars.color.foreground,
      fontFamily: themeVars.font.sans,
      lineHeight: 1.5,
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },
  },
});
