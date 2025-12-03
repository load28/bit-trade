import { style } from "@vanilla-extract/css";
import { componentsLayer } from "@/styles/layers.css";
import { themeVars } from "@/styles/theme.css";

/**
 * Page styles in the components layer (highest priority)
 * These will override utilities and base styles
 */

export const pageContainer = style({
  "@layer": {
    [componentsLayer]: {
      display: "flex",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      background: themeVars.color.muted,
      fontFamily: themeVars.font.sans,
    },
  },
});

export const main = style({
  "@layer": {
    [componentsLayer]: {
      display: "flex",
      minHeight: "100vh",
      width: "100%",
      maxWidth: "48rem",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8rem 4rem",
      background: themeVars.color.background,
      "@media": {
        "(min-width: 640px)": {
          alignItems: "flex-start",
        },
      },
    },
  },
});

export const logo = style({
  "@layer": {
    [componentsLayer]: {
      transition: "filter 0.2s",
      selectors: {
        '[data-theme="dark"] &': {
          filter: "invert(1)",
        },
      },
    },
  },
});

export const contentSection = style({
  "@layer": {
    [componentsLayer]: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: themeVars.spacing.lg,
      textAlign: "center",
      "@media": {
        "(min-width: 640px)": {
          alignItems: "flex-start",
          textAlign: "left",
        },
      },
    },
  },
});

export const title = style({
  "@layer": {
    [componentsLayer]: {
      maxWidth: "20rem",
      fontSize: "1.875rem",
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: "-0.025em",
      color: themeVars.color.foreground,
    },
  },
});

export const description = style({
  "@layer": {
    [componentsLayer]: {
      maxWidth: "28rem",
      fontSize: "1.125rem",
      lineHeight: 2,
      color: themeVars.color.mutedForeground,
    },
  },
});

export const link = style({
  "@layer": {
    [componentsLayer]: {
      fontWeight: 500,
      color: themeVars.color.foreground,
    },
  },
});

export const buttonGroup = style({
  "@layer": {
    [componentsLayer]: {
      display: "flex",
      flexDirection: "column",
      gap: themeVars.spacing.md,
      fontSize: "1rem",
      fontWeight: 500,
      "@media": {
        "(min-width: 640px)": {
          flexDirection: "row",
        },
      },
    },
  },
});

export const primaryButton = style({
  "@layer": {
    [componentsLayer]: {
      display: "flex",
      height: "3rem",
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      gap: themeVars.spacing.sm,
      borderRadius: themeVars.radius.full,
      background: themeVars.color.foreground,
      paddingInline: "1.25rem",
      color: themeVars.color.background,
      transition: "background-color 0.2s",
      ":hover": {
        background: themeVars.color.mutedForeground,
      },
      "@media": {
        "(min-width: 768px)": {
          width: "158px",
        },
      },
    },
  },
});

export const secondaryButton = style({
  "@layer": {
    [componentsLayer]: {
      display: "flex",
      height: "3rem",
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: themeVars.radius.full,
      border: `1px solid ${themeVars.color.border}`,
      paddingInline: "1.25rem",
      transition: "background-color 0.2s, border-color 0.2s",
      ":hover": {
        borderColor: "transparent",
        background: themeVars.color.muted,
      },
      "@media": {
        "(min-width: 768px)": {
          width: "158px",
        },
      },
    },
  },
});
