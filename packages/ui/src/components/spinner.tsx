import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";

import { cn } from "../lib/cn";

const spinnerVariants = cva("shrink-0 animate-spin text-current", {
  variants: {
    size: {
      xs: "size-3",
      sm: "size-4",
      default: "size-5",
      lg: "size-6",
      xl: "size-8",
    },
    variant: {
      default: "text-current",
      muted: "text-muted-foreground",
      primary: "text-primary",
      secondary: "text-secondary-foreground",
      destructive: "text-destructive",
    },
  },
  defaultVariants: {
    size: "sm",
    variant: "default",
  },
});

const dotsSpinnerVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1 text-current",
  {
    variants: {
      size: {
        xs: "h-3 [--spinner-dot-size:0.1875rem]",
        sm: "h-4 [--spinner-dot-size:0.25rem]",
        default: "h-5 [--spinner-dot-size:0.3125rem]",
        lg: "h-6 [--spinner-dot-size:0.375rem]",
        xl: "h-8 gap-1.5 [--spinner-dot-size:0.5rem]",
      },
      variant: {
        default: "text-current",
        muted: "text-muted-foreground",
        primary: "text-primary",
        secondary: "text-secondary-foreground",
        destructive: "text-destructive",
      },
    },
    defaultVariants: {
      size: "sm",
      variant: "default",
    },
  },
);

const pulseSpinnerVariants = cva("relative inline-flex shrink-0 text-current", {
  variants: {
    size: {
      xs: "size-3",
      sm: "size-4",
      default: "size-5",
      lg: "size-6",
      xl: "size-8",
    },
    variant: {
      default: "text-current",
      muted: "text-muted-foreground",
      primary: "text-primary",
      secondary: "text-secondary-foreground",
      destructive: "text-destructive",
    },
  },
  defaultVariants: {
    size: "sm",
    variant: "default",
  },
});

type SpinnerAccessibilityProps = {
  label?: string;
  decorative?: boolean;
};

type SpinnerProps = React.ComponentProps<"svg"> &
  VariantProps<typeof spinnerVariants> &
  SpinnerAccessibilityProps;

type DotsSpinnerProps = React.ComponentProps<"span"> &
  VariantProps<typeof dotsSpinnerVariants> &
  SpinnerAccessibilityProps;

type PulseSpinnerProps = React.ComponentProps<"span"> &
  VariantProps<typeof pulseSpinnerVariants> &
  SpinnerAccessibilityProps;

function getLoadingA11yProps({
  ariaLabel,
  decorative,
  label = "Loading",
}: {
  ariaLabel?: string;
  decorative?: boolean | null;
  label?: string | null;
}) {
  return decorative
    ? { "aria-hidden": true }
    : { role: "status", "aria-label": ariaLabel ?? label ?? "Loading" };
}

function Spinner({
  className,
  size = "sm",
  variant = "default",
  label = "Loading",
  decorative,
  "aria-label": ariaLabel,
  ...props
}: SpinnerProps) {
  return (
    <Loader2Icon
      data-slot="spinner"
      data-size={size}
      data-variant={variant}
      className={cn(spinnerVariants({ size, variant }), className)}
      {...getLoadingA11yProps({ ariaLabel, decorative, label })}
      {...props}
    />
  );
}

function DotsSpinner({
  className,
  size = "sm",
  variant = "default",
  label = "Loading",
  decorative,
  "aria-label": ariaLabel,
  ...props
}: DotsSpinnerProps) {
  return (
    <span
      data-slot="dots-spinner"
      data-size={size}
      data-variant={variant}
      className={cn(dotsSpinnerVariants({ size, variant }), className)}
      {...getLoadingA11yProps({ ariaLabel, decorative, label })}
      {...props}
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          data-slot="dots-spinner-dot"
          className="size-[var(--spinner-dot-size)] rounded-full bg-current animate-pulse"
          style={{ animationDelay: `${index * 140}ms` }}
        />
      ))}
    </span>
  );
}

function PulseSpinner({
  className,
  size = "sm",
  variant = "default",
  label = "Loading",
  decorative,
  "aria-label": ariaLabel,
  ...props
}: PulseSpinnerProps) {
  return (
    <span
      data-slot="pulse-spinner"
      data-size={size}
      data-variant={variant}
      className={cn(pulseSpinnerVariants({ size, variant }), className)}
      {...getLoadingA11yProps({ ariaLabel, decorative, label })}
      {...props}
    >
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-70" />
      <span className="relative inline-flex size-full rounded-full bg-current" />
    </span>
  );
}

export {
  DotsSpinner,
  PulseSpinner,
  Spinner,
  dotsSpinnerVariants,
  pulseSpinnerVariants,
  spinnerVariants,
};
export type { DotsSpinnerProps, PulseSpinnerProps, SpinnerProps };
