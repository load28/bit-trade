import { style } from "@vanilla-extract/css";
import { componentsLayer } from "@/styles/layers.css";
import { tokens } from "@/styles/tokens.css";

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
      background: tokens.colors.muted,
      fontFamily: tokens.typography.fontFamily.sans,
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
      background: tokens.colors.background,
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
      gap: tokens.spacing["6"],
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
      color: tokens.colors.foreground,
    },
  },
});

export const description = style({
  "@layer": {
    [componentsLayer]: {
      maxWidth: "28rem",
      fontSize: "1.125rem",
      lineHeight: 2,
      color: tokens.colors.mutedForeground,
    },
  },
});

export const link = style({
  "@layer": {
    [componentsLayer]: {
      fontWeight: 500,
      color: tokens.colors.foreground,
    },
  },
});

export const buttonGroup = style({
  "@layer": {
    [componentsLayer]: {
      display: "flex",
      flexDirection: "column",
      gap: tokens.spacing["4"],
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
      gap: tokens.spacing["2"],
      borderRadius: tokens.radius.full,
      background: tokens.colors.foreground,
      paddingInline: "1.25rem",
      color: tokens.colors.background,
      transition: "background-color 0.2s",
      ":hover": {
        background: tokens.colors.mutedForeground,
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
      borderRadius: tokens.radius.full,
      border: `1px solid ${tokens.colors.border}`,
      paddingInline: "1.25rem",
      transition: "background-color 0.2s, border-color 0.2s",
      ":hover": {
        borderColor: "transparent",
        background: tokens.colors.muted,
      },
      "@media": {
        "(min-width: 768px)": {
          width: "158px",
        },
      },
    },
  },
});
