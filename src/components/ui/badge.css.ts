import { recipe, RecipeVariants } from "@vanilla-extract/recipes";
import { tokens } from "@/styles/tokens.css";
import { componentsLayer } from "@/styles/layers.css";

export const badgeRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: tokens.spacing["1"],
        borderRadius: tokens.radius.full,
        fontSize: tokens.typography.fontSize.xs,
        fontWeight: tokens.typography.fontWeight.medium,
        lineHeight: 1,
        whiteSpace: "nowrap",
        transition: `all ${tokens.transition.duration.fast} ${tokens.transition.easing.easeInOut}`,
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
          },
        },
      },
      secondary: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: tokens.colors.secondary,
            color: tokens.colors.secondaryForeground,
          },
        },
      },
      outline: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: "transparent",
            border: `1px solid ${tokens.colors.border}`,
            color: tokens.colors.foreground,
          },
        },
      },
      // 트레이딩 특화 뱃지
      profit: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: tokens.colors.profit,
            color: tokens.colors.profitForeground,
          },
        },
      },
      loss: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: tokens.colors.loss,
            color: tokens.colors.lossForeground,
          },
        },
      },
      profitSubtle: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: `color-mix(in srgb, ${tokens.colors.profit} 15%, transparent)`,
            color: tokens.colors.profit,
          },
        },
      },
      lossSubtle: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: `color-mix(in srgb, ${tokens.colors.loss} 15%, transparent)`,
            color: tokens.colors.loss,
          },
        },
      },
      // 상태 뱃지
      success: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: tokens.colors.success,
            color: tokens.colors.successForeground,
          },
        },
      },
      warning: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: tokens.colors.warning,
            color: tokens.colors.warningForeground,
          },
        },
      },
      error: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: tokens.colors.error,
            color: tokens.colors.errorForeground,
          },
        },
      },
      info: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: tokens.colors.info,
            color: tokens.colors.infoForeground,
          },
        },
      },
    },

    size: {
      default: {
        "@layer": {
          [componentsLayer]: {
            height: "1.375rem",  // 22px
            paddingInline: tokens.spacing["2"],
          },
        },
      },
      sm: {
        "@layer": {
          [componentsLayer]: {
            height: "1.125rem",  // 18px
            paddingInline: tokens.spacing["1"],
            fontSize: "0.625rem",  // 10px
          },
        },
      },
      lg: {
        "@layer": {
          [componentsLayer]: {
            height: "1.625rem",  // 26px
            paddingInline: tokens.spacing["3"],
            fontSize: tokens.typography.fontSize.sm,
          },
        },
      },
    },
  },

  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type BadgeVariants = RecipeVariants<typeof badgeRecipe>;
