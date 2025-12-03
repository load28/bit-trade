"use client";

import * as React from "react";
import {
  inputRecipe,
  inputWrapper,
  inputIcon,
  inputIconRight,
  inputWithLeftIcon,
  inputWithRightIcon,
} from "./input.css";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "default" | "sm" | "lg";
  variant?: "default" | "ghost" | "filled";
  numeric?: boolean;
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      size,
      variant,
      numeric,
      error,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const inputClass = inputRecipe({ size, variant, numeric, error });

    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon;

    const combinedClassName = [
      inputClass,
      hasLeftIcon && inputWithLeftIcon,
      hasRightIcon && inputWithRightIcon,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (hasLeftIcon || hasRightIcon) {
      return (
        <div className={inputWrapper}>
          {hasLeftIcon && <span className={inputIcon}>{leftIcon}</span>}
          <input
            type={type}
            className={combinedClassName}
            ref={ref}
            {...props}
          />
          {hasRightIcon && <span className={inputIconRight}>{rightIcon}</span>}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={className ? `${inputClass} ${className}` : inputClass}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
