import { recipe, RecipeVariants } from "@vanilla-extract/recipes";
import { tokens } from "@/styles/tokens.css";
import { componentsLayer } from "@/styles/layers.css";

export const buttonRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: tokens.spacing["2"],
        whiteSpace: "nowrap",
        borderRadius: tokens.radius.md,
        fontSize: tokens.typography.fontSize.sm,
        fontWeight: tokens.typography.fontWeight.medium,
        fontFamily: "inherit",
        cursor: "pointer",
        border: "none",
        outline: "none",
        transition: `all ${tokens.transition.duration.fast} ${tokens.transition.easing.easeInOut}`,
        ":focus-visible": {
          outline: "none",
          boxShadow: `0 0 0 2px ${tokens.colors.background}, 0 0 0 4px ${tokens.colors.ring}`,
        },
        ":disabled": {
          pointerEvents: "none",
          opacity: "0.5",
        },
        selectors: {
          "&[data-loading='true']": {
            pointerEvents: "none",
          },
        },
      },
    },
  },

  variants: {
    variant: {
      default: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: tokens.colors.primary,
            color: tokens.colors.primaryForeground,
            ":hover": {
              opacity: "0.9",
            },
          },
        },
      },
      destructive: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: tokens.colors.error,
            color: tokens.colors.errorForeground,
            ":hover": {
              opacity: "0.9",
            },
          },
        },
      },
      outline: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: "transparent",
            border: `1px solid ${tokens.colors.border}`,
            color: tokens.colors.foreground,
            ":hover": {
              backgroundColor: tokens.colors.accent,
              color: tokens.colors.accentForeground,
            },
          },
        },
      },
      secondary: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: tokens.colors.secondary,
            color: tokens.colors.secondaryForeground,
            ":hover": {
              opacity: "0.8",
            },
          },
        },
      },
      ghost: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: "transparent",
            color: tokens.colors.foreground,
            ":hover": {
              backgroundColor: tokens.colors.accent,
              color: tokens.colors.accentForeground,
            },
          },
        },
      },
      link: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: "transparent",
            color: tokens.colors.primary,
            textDecoration: "underline",
            textUnderlineOffset: "4px",
            ":hover": {
              textDecoration: "underline",
            },
          },
        },
      },
      // 트레이딩 특화 버튼
      profit: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: tokens.colors.profit,
            color: tokens.colors.profitForeground,
            ":hover": {
              opacity: "0.9",
            },
          },
        },
      },
      loss: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: tokens.colors.loss,
            color: tokens.colors.lossForeground,
            ":hover": {
              opacity: "0.9",
            },
          },
        },
      },
    },

    size: {
      default: {
        "@layer": {
          [componentsLayer]: {
            height: "2.5rem",   // 40px
            paddingInline: tokens.spacing["4"],
            paddingBlock: tokens.spacing["2"],
          },
        },
      },
      sm: {
        "@layer": {
          [componentsLayer]: {
            height: "2rem",    // 32px
            paddingInline: tokens.spacing["3"],
            fontSize: tokens.typography.fontSize.xs,
            borderRadius: tokens.radius.sm,
          },
        },
      },
      lg: {
        "@layer": {
          [componentsLayer]: {
            height: "3rem",    // 48px
            paddingInline: tokens.spacing["6"],
            fontSize: tokens.typography.fontSize.base,
            borderRadius: tokens.radius.lg,
          },
        },
      },
      icon: {
        "@layer": {
          [componentsLayer]: {
            height: "2.5rem",
            width: "2.5rem",
            padding: 0,
          },
        },
      },
    },

    fullWidth: {
      true: {
        "@layer": {
          [componentsLayer]: {
            width: "100%",
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

export type ButtonVariants = RecipeVariants<typeof buttonRecipe>;
