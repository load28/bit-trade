import { style } from "@vanilla-extract/css";
import { componentsLayer } from "@/styles/layers.css";
import { themeVars } from "@/styles/theme.css";

export const themeToggleButton = style({
  "@layer": {
    [componentsLayer]: {
      position: "fixed",
      top: "1rem",
      right: "1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "2.5rem",
      height: "2.5rem",
      borderRadius: themeVars.radius.lg,
      border: `1px solid ${themeVars.color.border}`,
      background: themeVars.color.background,
      cursor: "pointer",
      transition: "background-color 0.2s, border-color 0.2s",
      ":hover": {
        background: themeVars.color.muted,
      },
    },
  },
});

export const iconSun = style({
  "@layer": {
    [componentsLayer]: {
      width: "1.25rem",
      height: "1.25rem",
      color: themeVars.color.foreground,
      transition: "transform 0.3s, opacity 0.3s",
      selectors: {
        '[data-theme="dark"] &': {
          transform: "rotate(90deg) scale(0)",
          opacity: 0,
        },
      },
    },
  },
});

export const iconMoon = style({
  "@layer": {
    [componentsLayer]: {
      position: "absolute",
      width: "1.25rem",
      height: "1.25rem",
      color: themeVars.color.foreground,
      transition: "transform 0.3s, opacity 0.3s",
      transform: "rotate(-90deg) scale(0)",
      opacity: 0,
      selectors: {
        '[data-theme="dark"] &': {
          transform: "rotate(0deg) scale(1)",
          opacity: 1,
        },
      },
    },
  },
});
