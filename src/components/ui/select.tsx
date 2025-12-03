"use client";

import * as React from "react";
import {
  selectWrapper,
  selectTriggerRecipe,
  selectIcon,
  selectContent,
  selectViewport,
  selectItem as selectItemStyle,
  selectItemIndicator,
  selectSeparator as selectSeparatorStyle,
  selectLabel as selectLabelStyle,
} from "./select.css";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(
  undefined
);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select provider");
  }
  return context;
}

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.5 4.5L6.5 11.5L3 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  children,
}) => {
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
      setOpen(false);
    },
    [isControlled, onValueChange]
  );

  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        const content = document.querySelector("[data-select-content]");
        if (!content?.contains(target)) {
          setOpen(false);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <SelectContext.Provider
      value={{ value, onValueChange: handleValueChange, open, setOpen, triggerRef }}
    >
      <div className={selectWrapper}>{children}</div>
    </SelectContext.Provider>
  );
};

export interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "default" | "sm" | "lg";
  error?: boolean;
  placeholder?: string;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, size, error, placeholder, children, ...props }, ref) => {
    const { value, open, setOpen, triggerRef } = useSelectContext();

    const mergedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref, triggerRef]
    );

    const triggerClass = selectTriggerRecipe({ size, error });
    const hasValue = value !== "";

    return (
      <button
        ref={mergedRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        data-state={open ? "open" : "closed"}
        data-placeholder={!hasValue ? "" : undefined}
        className={className ? `${triggerClass} ${className}` : triggerClass}
        onClick={() => setOpen(!open)}
        {...props}
      >
        <span>{hasValue ? children : placeholder}</span>
        <span className={selectIcon}>
          <ChevronDownIcon />
        </span>
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

export interface SelectValueProps {
  placeholder?: string;
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value } = useSelectContext();
  return <>{value || placeholder}</>;
};

export interface SelectContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = useSelectContext();

    if (!open) return null;

    return (
      <div
        ref={ref}
        role="listbox"
        data-state={open ? "open" : "closed"}
        data-select-content
        className={className ? `${selectContent} ${className}` : selectContent}
        {...props}
      >
        <div className={selectViewport}>{children}</div>
      </div>
    );
  }
);
SelectContent.displayName = "SelectContent";

export interface SelectItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value, disabled, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useSelectContext();
    const isSelected = selectedValue === value;

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        data-selected={isSelected ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={
          className ? `${selectItemStyle} ${className}` : selectItemStyle
        }
        onClick={() => !disabled && onValueChange(value)}
        {...props}
      >
        {children}
        {isSelected && (
          <span className={selectItemIndicator}>
            <CheckIcon />
          </span>
        )}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={
      className ? `${selectSeparatorStyle} ${className}` : selectSeparatorStyle
    }
    {...props}
  />
));
SelectSeparator.displayName = "SelectSeparator";

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={
      className ? `${selectLabelStyle} ${className}` : selectLabelStyle
    }
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

const SelectGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => (
  <div ref={ref} role="group" {...props}>
    {children}
  </div>
));
SelectGroup.displayName = "SelectGroup";

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectLabel,
  SelectGroup,
};
