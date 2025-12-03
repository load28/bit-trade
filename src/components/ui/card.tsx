import * as React from "react";
import {
  cardRecipe,
  cardHeader as cardHeaderStyle,
  cardTitle as cardTitleStyle,
  cardDescription as cardDescriptionStyle,
  cardContent as cardContentStyle,
  cardFooter as cardFooterStyle,
} from "./card.css";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "ghost" | "outline";
  padding?: "none" | "sm" | "default" | "lg";
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, ...props }, ref) => {
    const cardClass = cardRecipe({ variant, padding, interactive });
    return (
      <div
        ref={ref}
        className={className ? `${cardClass} ${className}` : cardClass}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={className ? `${cardHeaderStyle} ${className}` : cardHeaderStyle}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={className ? `${cardTitleStyle} ${className}` : cardTitleStyle}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={
      className
        ? `${cardDescriptionStyle} ${className}`
        : cardDescriptionStyle
    }
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={
      className ? `${cardContentStyle} ${className}` : cardContentStyle
    }
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={
      className ? `${cardFooterStyle} ${className}` : cardFooterStyle
    }
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
