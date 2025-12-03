import { style, globalStyle } from "@vanilla-extract/css";
import { recipe, RecipeVariants } from "@vanilla-extract/recipes";
import { tokens } from "@/styles/tokens.css";
import { componentsLayer } from "@/styles/layers.css";

export const tableWrapper = style({
  "@layer": {
    [componentsLayer]: {
      position: "relative",
      width: "100%",
      overflow: "auto",
    },
  },
});

export const table = style({
  "@layer": {
    [componentsLayer]: {
      width: "100%",
      captionSide: "bottom",
      fontSize: tokens.typography.fontSize.sm,
      borderCollapse: "collapse",
    },
  },
});

export const tableHeader = style({
  "@layer": {
    [componentsLayer]: {
      borderBottom: `1px solid ${tokens.colors.border}`,
    },
  },
});

export const tableBody = style({
  "@layer": {
    [componentsLayer]: {},
  },
});

// 마지막 row의 border 제거
globalStyle(`${tableBody} tr:last-child`, {
  "@layer": {
    [componentsLayer]: {
      borderBottom: 0,
    },
  },
});

export const tableFooter = style({
  "@layer": {
    [componentsLayer]: {
      borderTop: `1px solid ${tokens.colors.border}`,
      backgroundColor: tokens.colors.muted,
      fontWeight: tokens.typography.fontWeight.medium,
    },
  },
});

export const tableRowRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        borderBottom: `1px solid ${tokens.colors.border}`,
        transition: `background-color ${tokens.transition.duration.fast} ${tokens.transition.easing.easeInOut}`,
      },
    },
  },

  variants: {
    interactive: {
      true: {
        "@layer": {
          [componentsLayer]: {
            cursor: "pointer",
            ":hover": {
              backgroundColor: tokens.colors.muted,
            },
          },
        },
      },
    },
    selected: {
      true: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: tokens.colors.accent,
          },
        },
      },
    },
  },

  defaultVariants: {
    interactive: false,
    selected: false,
  },
});

export const tableHead = style({
  "@layer": {
    [componentsLayer]: {
      height: "2.75rem",  // 44px
      paddingInline: tokens.spacing["3"],
      textAlign: "left",
      verticalAlign: "middle",
      fontWeight: tokens.typography.fontWeight.medium,
      color: tokens.colors.mutedForeground,
      selectors: {
        "&[data-align='center']": {
          textAlign: "center",
        },
        "&[data-align='right']": {
          textAlign: "right",
        },
      },
    },
  },
});

export const tableCellRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        height: "2.75rem",  // 44px
        paddingInline: tokens.spacing["3"],
        verticalAlign: "middle",
      },
    },
  },

  variants: {
    align: {
      left: {
        "@layer": {
          [componentsLayer]: {
            textAlign: "left",
          },
        },
      },
      center: {
        "@layer": {
          [componentsLayer]: {
            textAlign: "center",
          },
        },
      },
      right: {
        "@layer": {
          [componentsLayer]: {
            textAlign: "right",
          },
        },
      },
    },
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
    // 트레이딩용 색상
    profit: {
      true: {
        "@layer": {
          [componentsLayer]: {
            color: tokens.colors.profit,
          },
        },
      },
    },
    loss: {
      true: {
        "@layer": {
          [componentsLayer]: {
            color: tokens.colors.loss,
          },
        },
      },
    },
  },

  defaultVariants: {
    align: "left",
    numeric: false,
    profit: false,
    loss: false,
  },
});

export const tableCaption = style({
  "@layer": {
    [componentsLayer]: {
      marginTop: tokens.spacing["3"],
      fontSize: tokens.typography.fontSize.sm,
      color: tokens.colors.mutedForeground,
    },
  },
});

// 빈 상태 표시
export const tableEmpty = style({
  "@layer": {
    [componentsLayer]: {
      padding: tokens.spacing["8"],
      textAlign: "center",
      color: tokens.colors.mutedForeground,
    },
  },
});

export type TableRowVariants = RecipeVariants<typeof tableRowRecipe>;
export type TableCellVariants = RecipeVariants<typeof tableCellRecipe>;
