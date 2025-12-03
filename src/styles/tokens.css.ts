import {
  createGlobalTheme,
  createThemeContract,
  globalStyle,
} from "@vanilla-extract/css";
import { baseLayer } from "./layers.css";

/**
 * Design Tokens - 토스 스타일의 깔끔한 디자인 시스템
 * 트레이딩 화면에 최적화된 토큰 구조
 */

/**
 * Theme Contract - 모든 테마가 구현해야 하는 변수 정의
 */
export const tokens = createThemeContract({
  // 색상 시스템
  colors: {
    // 기본 색상
    background: null,
    foreground: null,

    // 카드/패널 배경
    card: null,
    cardForeground: null,

    // 팝오버/드롭다운 배경
    popover: null,
    popoverForeground: null,

    // 주요 액션 색상 (CTA 버튼 등)
    primary: null,
    primaryForeground: null,

    // 보조 색상
    secondary: null,
    secondaryForeground: null,

    // Muted (비활성, 힌트 텍스트)
    muted: null,
    mutedForeground: null,

    // 강조 색상
    accent: null,
    accentForeground: null,

    // 트레이딩 특화 색상
    profit: null,        // 상승/수익 (녹색 계열)
    profitForeground: null,
    loss: null,          // 하락/손실 (빨간색 계열)
    lossForeground: null,

    // 상태 색상
    success: null,
    successForeground: null,
    warning: null,
    warningForeground: null,
    error: null,
    errorForeground: null,
    info: null,
    infoForeground: null,

    // UI 요소
    border: null,
    input: null,
    ring: null,

    // 오버레이
    overlay: null,
  },

  // 타이포그래피 시스템
  typography: {
    fontFamily: {
      sans: null,
      mono: null,
    },
    fontSize: {
      xs: null,      // 11px
      sm: null,      // 13px
      base: null,    // 15px
      lg: null,      // 17px
      xl: null,      // 20px
      "2xl": null,   // 24px
      "3xl": null,   // 30px
      "4xl": null,   // 36px
    },
    fontWeight: {
      normal: null,
      medium: null,
      semibold: null,
      bold: null,
    },
    lineHeight: {
      tight: null,   // 1.25
      normal: null,  // 1.5
      relaxed: null, // 1.75
    },
    letterSpacing: {
      tight: null,   // -0.025em
      normal: null,  // 0
      wide: null,    // 0.025em
    },
  },

  // 간격 시스템 (4px 기반)
  spacing: {
    "0": null,
    "1": null,   // 4px
    "2": null,   // 8px
    "3": null,   // 12px
    "4": null,   // 16px
    "5": null,   // 20px
    "6": null,   // 24px
    "8": null,   // 32px
    "10": null,  // 40px
    "12": null,  // 48px
    "16": null,  // 64px
    "20": null,  // 80px
    "24": null,  // 96px
  },

  // 둥근 모서리
  radius: {
    none: null,
    sm: null,    // 4px
    md: null,    // 8px
    lg: null,    // 12px
    xl: null,    // 16px
    "2xl": null, // 24px
    full: null,  // 9999px
  },

  // 그림자 시스템
  shadow: {
    none: null,
    sm: null,
    md: null,
    lg: null,
    xl: null,
  },

  // 트랜지션 시스템
  transition: {
    duration: {
      fast: null,    // 100ms
      normal: null,  // 200ms
      slow: null,    // 300ms
    },
    easing: {
      linear: null,
      easeIn: null,
      easeOut: null,
      easeInOut: null,
    },
  },

  // z-index 시스템
  zIndex: {
    hide: null,
    base: null,
    dropdown: null,
    sticky: null,
    fixed: null,
    overlay: null,
    modal: null,
    popover: null,
    tooltip: null,
  },
});

/**
 * Light Theme - 밝은 테마 (토스 스타일)
 */
createGlobalTheme(":root, [data-theme='light']", tokens, {
  colors: {
    background: "#ffffff",
    foreground: "#191f28",

    card: "#ffffff",
    cardForeground: "#191f28",

    popover: "#ffffff",
    popoverForeground: "#191f28",

    primary: "#3182f6",      // 토스 블루
    primaryForeground: "#ffffff",

    secondary: "#f2f4f6",
    secondaryForeground: "#4e5968",

    muted: "#f2f4f6",
    mutedForeground: "#8b95a1",

    accent: "#e8f3ff",
    accentForeground: "#3182f6",

    // 트레이딩 색상 (국제 표준: 녹색=상승, 빨간색=하락)
    profit: "#16b979",
    profitForeground: "#ffffff",
    loss: "#f04251",
    lossForeground: "#ffffff",

    success: "#16b979",
    successForeground: "#ffffff",
    warning: "#ff9f43",
    warningForeground: "#191f28",
    error: "#f04251",
    errorForeground: "#ffffff",
    info: "#3182f6",
    infoForeground: "#ffffff",

    border: "#e5e8eb",
    input: "#e5e8eb",
    ring: "#3182f6",

    overlay: "rgba(0, 0, 0, 0.4)",
  },

  typography: {
    fontFamily: {
      sans: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "var(--font-geist-mono), 'SF Mono', Monaco, Consolas, monospace",
    },
    fontSize: {
      xs: "0.6875rem",    // 11px
      sm: "0.8125rem",    // 13px
      base: "0.9375rem",  // 15px
      lg: "1.0625rem",    // 17px
      xl: "1.25rem",      // 20px
      "2xl": "1.5rem",    // 24px
      "3xl": "1.875rem",  // 30px
      "4xl": "2.25rem",   // 36px
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
    letterSpacing: {
      tight: "-0.025em",
      normal: "0",
      wide: "0.025em",
    },
  },

  spacing: {
    "0": "0",
    "1": "0.25rem",   // 4px
    "2": "0.5rem",    // 8px
    "3": "0.75rem",   // 12px
    "4": "1rem",      // 16px
    "5": "1.25rem",   // 20px
    "6": "1.5rem",    // 24px
    "8": "2rem",      // 32px
    "10": "2.5rem",   // 40px
    "12": "3rem",     // 48px
    "16": "4rem",     // 64px
    "20": "5rem",     // 80px
    "24": "6rem",     // 96px
  },

  radius: {
    none: "0",
    sm: "0.25rem",    // 4px
    md: "0.5rem",     // 8px
    lg: "0.75rem",    // 12px
    xl: "1rem",       // 16px
    "2xl": "1.5rem",  // 24px
    full: "9999px",
  },

  shadow: {
    none: "none",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
  },

  transition: {
    duration: {
      fast: "100ms",
      normal: "200ms",
      slow: "300ms",
    },
    easing: {
      linear: "linear",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },

  zIndex: {
    hide: "-1",
    base: "0",
    dropdown: "100",
    sticky: "200",
    fixed: "300",
    overlay: "400",
    modal: "500",
    popover: "600",
    tooltip: "700",
  },
});

/**
 * Dark Theme - 어두운 테마 (트레이딩 최적화)
 */
createGlobalTheme("[data-theme='dark']", tokens, {
  colors: {
    background: "#0d1117",
    foreground: "#e6edf3",

    card: "#161b22",
    cardForeground: "#e6edf3",

    popover: "#1c2128",
    popoverForeground: "#e6edf3",

    primary: "#4a9eff",
    primaryForeground: "#0d1117",

    secondary: "#21262d",
    secondaryForeground: "#b1bac4",

    muted: "#21262d",
    mutedForeground: "#7d8590",

    accent: "#1c3a5e",
    accentForeground: "#4a9eff",

    // 트레이딩 색상 (다크모드 최적화)
    profit: "#26d97f",
    profitForeground: "#0d1117",
    loss: "#ff6b6b",
    lossForeground: "#0d1117",

    success: "#26d97f",
    successForeground: "#0d1117",
    warning: "#ffc107",
    warningForeground: "#0d1117",
    error: "#ff6b6b",
    errorForeground: "#0d1117",
    info: "#4a9eff",
    infoForeground: "#0d1117",

    border: "#30363d",
    input: "#30363d",
    ring: "#4a9eff",

    overlay: "rgba(0, 0, 0, 0.6)",
  },

  typography: {
    fontFamily: {
      sans: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "var(--font-geist-mono), 'SF Mono', Monaco, Consolas, monospace",
    },
    fontSize: {
      xs: "0.6875rem",
      sm: "0.8125rem",
      base: "0.9375rem",
      lg: "1.0625rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
    letterSpacing: {
      tight: "-0.025em",
      normal: "0",
      wide: "0.025em",
    },
  },

  spacing: {
    "0": "0",
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem",
    "10": "2.5rem",
    "12": "3rem",
    "16": "4rem",
    "20": "5rem",
    "24": "6rem",
  },

  radius: {
    none: "0",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.5rem",
    full: "9999px",
  },

  shadow: {
    none: "none",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.2)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
  },

  transition: {
    duration: {
      fast: "100ms",
      normal: "200ms",
      slow: "300ms",
    },
    easing: {
      linear: "linear",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },

  zIndex: {
    hide: "-1",
    base: "0",
    dropdown: "100",
    sticky: "200",
    fixed: "300",
    overlay: "400",
    modal: "500",
    popover: "600",
    tooltip: "700",
  },
});

/**
 * Global base styles
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
      background: tokens.colors.background,
      color: tokens.colors.foreground,
      fontFamily: tokens.typography.fontFamily.sans,
      fontSize: tokens.typography.fontSize.base,
      lineHeight: tokens.typography.lineHeight.normal,
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },
  },
});

/**
 * 기본 selection 스타일
 */
globalStyle("::selection", {
  "@layer": {
    [baseLayer]: {
      backgroundColor: tokens.colors.primary,
      color: tokens.colors.primaryForeground,
    },
  },
});
