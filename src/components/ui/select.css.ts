import { style, keyframes } from "@vanilla-extract/css";
import { recipe, RecipeVariants } from "@vanilla-extract/recipes";
import { tokens } from "@/styles/tokens.css";
import { componentsLayer } from "@/styles/layers.css";

const fadeIn = keyframes({
  from: { opacity: 0, transform: "translateY(-4px)" },
  to: { opacity: 1, transform: "translateY(0)" },
});

const fadeOut = keyframes({
  from: { opacity: 1, transform: "translateY(0)" },
  to: { opacity: 0, transform: "translateY(-4px)" },
});

export const selectTriggerRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: tokens.spacing["2"],
        width: "100%",
        borderRadius: tokens.radius.md,
        border: `1px solid ${tokens.colors.input}`,
        backgroundColor: tokens.colors.background,
        color: tokens.colors.foreground,
        fontSize: tokens.typography.fontSize.sm,
        fontFamily: "inherit",
        cursor: "pointer",
        outline: "none",
        transition: `all ${tokens.transition.duration.fast} ${tokens.transition.easing.easeInOut}`,
        ":focus": {
          borderColor: tokens.colors.ring,
          boxShadow: `0 0 0 1px ${tokens.colors.ring}`,
        },
        ":disabled": {
          cursor: "not-allowed",
          opacity: "0.5",
        },
        selectors: {
          "&[data-placeholder]": {
            color: tokens.colors.mutedForeground,
          },
        },
      },
    },
  },

  variants: {
    size: {
      default: {
        "@layer": {
          [componentsLayer]: {
            height: "2.5rem",
            paddingInline: tokens.spacing["3"],
          },
        },
      },
      sm: {
        "@layer": {
          [componentsLayer]: {
            height: "2rem",
            paddingInline: tokens.spacing["2"],
            fontSize: tokens.typography.fontSize.xs,
          },
        },
      },
      lg: {
        "@layer": {
          [componentsLayer]: {
            height: "3rem",
            paddingInline: tokens.spacing["4"],
            fontSize: tokens.typography.fontSize.base,
          },
        },
      },
    },

    error: {
      true: {
        "@layer": {
          [componentsLayer]: {
            borderColor: tokens.colors.error,
            ":focus": {
              borderColor: tokens.colors.error,
              boxShadow: `0 0 0 1px ${tokens.colors.error}`,
            },
          },
        },
      },
    },
  },

  defaultVariants: {
    size: "default",
    error: false,
  },
});

export const selectIcon = style({
  "@layer": {
    [componentsLayer]: {
      flexShrink: 0,
      color: tokens.colors.mutedForeground,
      transition: `transform ${tokens.transition.duration.fast} ${tokens.transition.easing.easeInOut}`,
      selectors: {
        "[data-state='open'] &": {
          transform: "rotate(180deg)",
        },
      },
    },
  },
});

export const selectContent = style({
  "@layer": {
    [componentsLayer]: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      zIndex: tokens.zIndex.dropdown,
      marginTop: tokens.spacing["1"],
      backgroundColor: tokens.colors.popover,
      color: tokens.colors.popoverForeground,
      borderRadius: tokens.radius.md,
      border: `1px solid ${tokens.colors.border}`,
      boxShadow: tokens.shadow.md,
      overflow: "hidden",
      maxHeight: "15rem",
      overflowY: "auto",
      animation: `${fadeIn} ${tokens.transition.duration.fast} ${tokens.transition.easing.easeOut}`,
      selectors: {
        "&[data-state='closed']": {
          animation: `${fadeOut} ${tokens.transition.duration.fast} ${tokens.transition.easing.easeIn}`,
        },
      },
    },
  },
});

export const selectViewport = style({
  "@layer": {
    [componentsLayer]: {
      padding: tokens.spacing["1"],
    },
  },
});

export const selectItem = style({
  "@layer": {
    [componentsLayer]: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: tokens.spacing["2"],
      padding: tokens.spacing["2"],
      paddingInline: tokens.spacing["3"],
      fontSize: tokens.typography.fontSize.sm,
      borderRadius: tokens.radius.sm,
      cursor: "pointer",
      outline: "none",
      transition: `background-color ${tokens.transition.duration.fast} ${tokens.transition.easing.easeInOut}`,
      ":hover": {
        backgroundColor: tokens.colors.accent,
      },
      ":focus": {
        backgroundColor: tokens.colors.accent,
      },
      selectors: {
        "&[data-disabled]": {
          pointerEvents: "none",
          opacity: "0.5",
        },
        "&[data-selected]": {
          backgroundColor: tokens.colors.accent,
        },
      },
    },
  },
});

export const selectItemIndicator = style({
  "@layer": {
    [componentsLayer]: {
      position: "absolute",
      right: tokens.spacing["3"],
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: tokens.colors.primary,
    },
  },
});

export const selectSeparator = style({
  "@layer": {
    [componentsLayer]: {
      height: "1px",
      marginBlock: tokens.spacing["1"],
      backgroundColor: tokens.colors.border,
    },
  },
});

export const selectLabel = style({
  "@layer": {
    [componentsLayer]: {
      padding: tokens.spacing["2"],
      paddingInline: tokens.spacing["3"],
      fontSize: tokens.typography.fontSize.xs,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.mutedForeground,
    },
  },
});

export const selectWrapper = style({
  "@layer": {
    [componentsLayer]: {
      position: "relative",
      width: "100%",
    },
  },
});

export type SelectTriggerVariants = RecipeVariants<typeof selectTriggerRecipe>;
