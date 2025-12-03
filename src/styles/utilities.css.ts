import { style } from "@vanilla-extract/css";
import { utilitiesLayer } from "./layers.css";
import { themeVars } from "./theme.css";

/**
 * Utility styles in the utilities layer
 * These have lower priority than component styles
 */

// Flex utilities
export const flexCenter = style({
  "@layer": {
    [utilitiesLayer]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  },
});

export const flexCol = style({
  "@layer": {
    [utilitiesLayer]: {
      display: "flex",
      flexDirection: "column",
    },
  },
});

export const flexRow = style({
  "@layer": {
    [utilitiesLayer]: {
      display: "flex",
      flexDirection: "row",
    },
  },
});

export const flexBetween = style({
  "@layer": {
    [utilitiesLayer]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
  },
});

// Spacing utilities
export const gap1 = style({
  "@layer": {
    [utilitiesLayer]: {
      gap: themeVars.spacing.xs,
    },
  },
});

export const gap2 = style({
  "@layer": {
    [utilitiesLayer]: {
      gap: themeVars.spacing.sm,
    },
  },
});

export const gap4 = style({
  "@layer": {
    [utilitiesLayer]: {
      gap: themeVars.spacing.md,
    },
  },
});

export const gap6 = style({
  "@layer": {
    [utilitiesLayer]: {
      gap: themeVars.spacing.lg,
    },
  },
});

// Text utilities
export const textCenter = style({
  "@layer": {
    [utilitiesLayer]: {
      textAlign: "center",
    },
  },
});

export const textLeft = style({
  "@layer": {
    [utilitiesLayer]: {
      textAlign: "left",
    },
  },
});

export const textMuted = style({
  "@layer": {
    [utilitiesLayer]: {
      color: themeVars.color.mutedForeground,
    },
  },
});

// Size utilities
export const fullWidth = style({
  "@layer": {
    [utilitiesLayer]: {
      width: "100%",
    },
  },
});

export const fullHeight = style({
  "@layer": {
    [utilitiesLayer]: {
      height: "100%",
    },
  },
});

export const minHScreen = style({
  "@layer": {
    [utilitiesLayer]: {
      minHeight: "100vh",
    },
  },
});

// Container
export const container = style({
  "@layer": {
    [utilitiesLayer]: {
      width: "100%",
      maxWidth: "1200px",
      marginInline: "auto",
      paddingInline: themeVars.spacing.md,
    },
  },
});

// Visibility
export const srOnly = style({
  "@layer": {
    [utilitiesLayer]: {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: 0,
      margin: "-1px",
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      borderWidth: 0,
    },
  },
});
