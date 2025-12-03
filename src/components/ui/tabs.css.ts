import { style } from "@vanilla-extract/css";
import { recipe, RecipeVariants } from "@vanilla-extract/recipes";
import { tokens } from "@/styles/tokens.css";
import { componentsLayer } from "@/styles/layers.css";

export const tabsList = style({
  "@layer": {
    [componentsLayer]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: tokens.radius.md,
      backgroundColor: tokens.colors.muted,
      padding: tokens.spacing["1"],
      gap: tokens.spacing["1"],
    },
  },
});

export const tabsListLine = style({
  "@layer": {
    [componentsLayer]: {
      display: "inline-flex",
      alignItems: "center",
      gap: tokens.spacing["4"],
      borderBottom: `1px solid ${tokens.colors.border}`,
      backgroundColor: "transparent",
      padding: 0,
    },
  },
});

export const tabsTriggerRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        fontSize: tokens.typography.fontSize.sm,
        fontWeight: tokens.typography.fontWeight.medium,
        fontFamily: "inherit",
        cursor: "pointer",
        border: "none",
        outline: "none",
        transition: `all ${tokens.transition.duration.fast} ${tokens.transition.easing.easeInOut}`,
        color: tokens.colors.mutedForeground,
        ":focus-visible": {
          outline: "none",
          boxShadow: `0 0 0 2px ${tokens.colors.ring}`,
        },
        ":disabled": {
          pointerEvents: "none",
          opacity: "0.5",
        },
      },
    },
  },

  variants: {
    variant: {
      default: {
        "@layer": {
          [componentsLayer]: {
            borderRadius: tokens.radius.sm,
            paddingInline: tokens.spacing["3"],
            paddingBlock: tokens.spacing["1"],
            backgroundColor: "transparent",
            ":hover": {
              color: tokens.colors.foreground,
            },
            selectors: {
              "&[data-state='active']": {
                backgroundColor: tokens.colors.background,
                color: tokens.colors.foreground,
                boxShadow: tokens.shadow.sm,
              },
            },
          },
        },
      },
      line: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: "transparent",
            borderRadius: 0,
            paddingInline: tokens.spacing["1"],
            paddingBlock: tokens.spacing["2"],
            borderBottom: "2px solid transparent",
            marginBottom: "-1px",
            ":hover": {
              color: tokens.colors.foreground,
            },
            selectors: {
              "&[data-state='active']": {
                color: tokens.colors.foreground,
                borderBottomColor: tokens.colors.primary,
              },
            },
          },
        },
      },
    },

    size: {
      default: {
        "@layer": {
          [componentsLayer]: {
            height: "2rem",  // 32px
          },
        },
      },
      sm: {
        "@layer": {
          [componentsLayer]: {
            height: "1.75rem",  // 28px
            fontSize: tokens.typography.fontSize.xs,
          },
        },
      },
      lg: {
        "@layer": {
          [componentsLayer]: {
            height: "2.5rem",  // 40px
            fontSize: tokens.typography.fontSize.base,
          },
        },
      },
    },

    fullWidth: {
      true: {
        "@layer": {
          [componentsLayer]: {
            flex: 1,
          },
        },
      },
    },
  },

  defaultVariants: {
    variant: "default",
    size: "default",
    fullWidth: false,
  },
});

export const tabsContent = style({
  "@layer": {
    [componentsLayer]: {
      marginTop: tokens.spacing["3"],
      outline: "none",
      ":focus-visible": {
        outline: "none",
        boxShadow: `0 0 0 2px ${tokens.colors.ring}`,
        borderRadius: tokens.radius.md,
      },
    },
  },
});

export type TabsTriggerVariants = RecipeVariants<typeof tabsTriggerRecipe>;
