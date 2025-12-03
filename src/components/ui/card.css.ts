import { recipe, RecipeVariants } from "@vanilla-extract/recipes";
import { style } from "@vanilla-extract/css";
import { tokens } from "@/styles/tokens.css";
import { componentsLayer } from "@/styles/layers.css";

export const cardRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        borderRadius: tokens.radius.lg,
        backgroundColor: tokens.colors.card,
        color: tokens.colors.cardForeground,
        transition: `all ${tokens.transition.duration.fast} ${tokens.transition.easing.easeInOut}`,
      },
    },
  },

  variants: {
    variant: {
      default: {
        "@layer": {
          [componentsLayer]: {
            border: `1px solid ${tokens.colors.border}`,
          },
        },
      },
      elevated: {
        "@layer": {
          [componentsLayer]: {
            boxShadow: tokens.shadow.md,
            border: "none",
          },
        },
      },
      ghost: {
        "@layer": {
          [componentsLayer]: {
            border: "none",
            backgroundColor: "transparent",
          },
        },
      },
      outline: {
        "@layer": {
          [componentsLayer]: {
            border: `1px solid ${tokens.colors.border}`,
            backgroundColor: "transparent",
          },
        },
      },
    },

    padding: {
      none: {},
      sm: {
        "@layer": {
          [componentsLayer]: {
            padding: tokens.spacing["3"],
          },
        },
      },
      default: {
        "@layer": {
          [componentsLayer]: {
            padding: tokens.spacing["4"],
          },
        },
      },
      lg: {
        "@layer": {
          [componentsLayer]: {
            padding: tokens.spacing["6"],
          },
        },
      },
    },

    interactive: {
      true: {
        "@layer": {
          [componentsLayer]: {
            cursor: "pointer",
            ":hover": {
              borderColor: tokens.colors.ring,
            },
          },
        },
      },
    },
  },

  defaultVariants: {
    variant: "default",
    padding: "none",
    interactive: false,
  },
});

export const cardHeader = style({
  "@layer": {
    [componentsLayer]: {
      display: "flex",
      flexDirection: "column",
      gap: tokens.spacing["1"],
      padding: tokens.spacing["4"],
      paddingBottom: 0,
    },
  },
});

export const cardTitle = style({
  "@layer": {
    [componentsLayer]: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      lineHeight: tokens.typography.lineHeight.tight,
      letterSpacing: tokens.typography.letterSpacing.tight,
    },
  },
});

export const cardDescription = style({
  "@layer": {
    [componentsLayer]: {
      fontSize: tokens.typography.fontSize.sm,
      color: tokens.colors.mutedForeground,
    },
  },
});

export const cardContent = style({
  "@layer": {
    [componentsLayer]: {
      padding: tokens.spacing["4"],
    },
  },
});

export const cardFooter = style({
  "@layer": {
    [componentsLayer]: {
      display: "flex",
      alignItems: "center",
      padding: tokens.spacing["4"],
      paddingTop: 0,
    },
  },
});

export type CardVariants = RecipeVariants<typeof cardRecipe>;
