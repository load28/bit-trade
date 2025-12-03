"use client";

import * as React from "react";
import {
  tabsList,
  tabsListLine,
  tabsTriggerRecipe,
  tabsContent as tabsContentStyle,
} from "./tabs.css";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  variant: "default" | "line";
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: "default" | "line";
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      value: controlledValue,
      defaultValue,
      onValueChange,
      variant = "default",
      children,
      ...props
    },
    ref
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(
      defaultValue || ""
    );

    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : uncontrolledValue;

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (!isControlled) {
          setUncontrolledValue(newValue);
        }
        onValueChange?.(newValue);
      },
      [isControlled, onValueChange]
    );

    return (
      <TabsContext.Provider
        value={{ value, onValueChange: handleValueChange, variant }}
      >
        <div ref={ref} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  fullWidth?: boolean;
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, fullWidth, style, ...props }, ref) => {
    const { variant } = useTabsContext();
    const listClass = variant === "line" ? tabsListLine : tabsList;

    return (
      <div
        ref={ref}
        role="tablist"
        className={className ? `${listClass} ${className}` : listClass}
        style={fullWidth ? { ...style, width: "100%" } : style}
        {...props}
      />
    );
  }
);
TabsList.displayName = "TabsList";

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  size?: "default" | "sm" | "lg";
  fullWidth?: boolean;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, size, fullWidth, disabled, ...props }, ref) => {
    const { value: selectedValue, onValueChange, variant } = useTabsContext();
    const isActive = selectedValue === value;

    const triggerClass = tabsTriggerRecipe({ variant, size, fullWidth });

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={isActive}
        data-state={isActive ? "active" : "inactive"}
        disabled={disabled}
        className={className ? `${triggerClass} ${className}` : triggerClass}
        onClick={() => onValueChange(value)}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  forceMount?: boolean;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, forceMount, children, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext();
    const isActive = selectedValue === value;

    if (!isActive && !forceMount) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        data-state={isActive ? "active" : "inactive"}
        hidden={!isActive}
        tabIndex={0}
        className={
          className ? `${tabsContentStyle} ${className}` : tabsContentStyle
        }
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
