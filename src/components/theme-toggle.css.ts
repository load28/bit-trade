import { style } from "@vanilla-extract/css";
import { componentsLayer } from "@/styles/layers.css";
import { tokens } from "@/styles/tokens.css";

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
      borderRadius: tokens.radius.lg,
      border: `1px solid ${tokens.colors.border}`,
      background: tokens.colors.background,
      cursor: "pointer",
      transition: `background-color ${tokens.transition.duration.normal} ${tokens.transition.easing.easeInOut}, border-color ${tokens.transition.duration.normal} ${tokens.transition.easing.easeInOut}`,
      ":hover": {
        background: tokens.colors.muted,
      },
    },
  },
});

export const iconSun = style({
  "@layer": {
    [componentsLayer]: {
      width: "1.25rem",
      height: "1.25rem",
      color: tokens.colors.foreground,
      transition: `transform ${tokens.transition.duration.slow} ${tokens.transition.easing.easeInOut}, opacity ${tokens.transition.duration.slow} ${tokens.transition.easing.easeInOut}`,
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
      color: tokens.colors.foreground,
      transition: `transform ${tokens.transition.duration.slow} ${tokens.transition.easing.easeInOut}, opacity ${tokens.transition.duration.slow} ${tokens.transition.easing.easeInOut}`,
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
