import * as React from "react";
import { badgeRecipe } from "./badge.css";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "profit" | "loss" | "profitSubtle" | "lossSubtle" | "success" | "warning" | "error" | "info";
  size?: "default" | "sm" | "lg";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    const badgeClass = badgeRecipe({ variant, size });
    return (
      <div
        ref={ref}
        className={className ? `${badgeClass} ${className}` : badgeClass}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

interface PriceChangeBadgeProps extends Omit<BadgeProps, "variant"> {
  value: number;
  showSign?: boolean;
  suffix?: string;
}

const PriceChangeBadge = React.forwardRef<HTMLDivElement, PriceChangeBadgeProps>(
  ({ value, showSign = true, suffix = "%", className, ...props }, ref) => {
    const isPositive = value > 0;
    const isNegative = value < 0;
    const variant = isPositive ? "profitSubtle" : isNegative ? "lossSubtle" : "secondary";

    const displayValue = Math.abs(value);
    const sign = showSign ? (isPositive ? "+" : isNegative ? "-" : "") : "";

    return (
      <Badge ref={ref} variant={variant} className={className} {...props}>
        {sign}
        {displayValue.toFixed(2)}
        {suffix}
      </Badge>
    );
  }
);

PriceChangeBadge.displayName = "PriceChangeBadge";

export { Badge, PriceChangeBadge };
