import { recipe, RecipeVariants } from "@vanilla-extract/recipes";
import { style } from "@vanilla-extract/css";
import { tokens } from "@/styles/tokens.css";
import { componentsLayer } from "@/styles/layers.css";

export const inputRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        display: "flex",
        width: "100%",
        borderRadius: tokens.radius.md,
        border: `1px solid ${tokens.colors.input}`,
        backgroundColor: tokens.colors.background,
        color: tokens.colors.foreground,
        fontSize: tokens.typography.fontSize.sm,
        fontFamily: "inherit",
        transition: `all ${tokens.transition.duration.fast} ${tokens.transition.easing.easeInOut}`,
        outline: "none",
        "::placeholder": {
          color: tokens.colors.mutedForeground,
        },
        ":focus": {
          borderColor: tokens.colors.ring,
          boxShadow: `0 0 0 1px ${tokens.colors.ring}`,
        },
        ":disabled": {
          cursor: "not-allowed",
          opacity: "0.5",
          backgroundColor: tokens.colors.muted,
        },
        // 숫자 입력 스피너 숨기기
        selectors: {
          "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
            WebkitAppearance: "none",
            margin: 0,
          },
          '&[type="number"]': {
            MozAppearance: "textfield",
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
            height: "2.5rem",   // 40px
            paddingInline: tokens.spacing["3"],
            paddingBlock: tokens.spacing["2"],
          },
        },
      },
      sm: {
        "@layer": {
          [componentsLayer]: {
            height: "2rem",    // 32px
            paddingInline: tokens.spacing["2"],
            fontSize: tokens.typography.fontSize.xs,
          },
        },
      },
      lg: {
        "@layer": {
          [componentsLayer]: {
            height: "3rem",    // 48px
            paddingInline: tokens.spacing["4"],
            fontSize: tokens.typography.fontSize.base,
          },
        },
      },
    },

    variant: {
      default: {},
      ghost: {
        "@layer": {
          [componentsLayer]: {
            border: "none",
            backgroundColor: "transparent",
            ":focus": {
              boxShadow: "none",
              backgroundColor: tokens.colors.muted,
            },
          },
        },
      },
      filled: {
        "@layer": {
          [componentsLayer]: {
            border: "none",
            backgroundColor: tokens.colors.muted,
            ":focus": {
              boxShadow: "none",
              backgroundColor: tokens.colors.secondary,
            },
          },
        },
      },
    },

    // 트레이딩용 숫자 입력
    numeric: {
      true: {
        "@layer": {
          [componentsLayer]: {
            fontFamily: tokens.typography.fontFamily.mono,
            textAlign: "right",
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
    variant: "default",
    numeric: false,
    error: false,
  },
});

// Input 래퍼 (아이콘 등을 위한)
export const inputWrapper = style({
  "@layer": {
    [componentsLayer]: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      width: "100%",
    },
  },
});

export const inputIcon = style({
  "@layer": {
    [componentsLayer]: {
      position: "absolute",
      left: tokens.spacing["3"],
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: tokens.colors.mutedForeground,
      pointerEvents: "none",
    },
  },
});

export const inputIconRight = style({
  "@layer": {
    [componentsLayer]: {
      position: "absolute",
      right: tokens.spacing["3"],
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: tokens.colors.mutedForeground,
    },
  },
});

export const inputWithLeftIcon = style({
  "@layer": {
    [componentsLayer]: {
      paddingLeft: tokens.spacing["10"],
    },
  },
});

export const inputWithRightIcon = style({
  "@layer": {
    [componentsLayer]: {
      paddingRight: tokens.spacing["10"],
    },
  },
});

export type InputVariants = RecipeVariants<typeof inputRecipe>;
