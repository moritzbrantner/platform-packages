import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";

const loadingBarVariants = cva("inline-flex w-full min-w-0 items-center gap-2 text-current", {
  variants: {
    size: {
      xs: "[--loading-bar-height:0.1875rem]",
      sm: "[--loading-bar-height:0.25rem]",
      default: "[--loading-bar-height:0.375rem]",
      lg: "[--loading-bar-height:0.5rem]",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const loadingBarIndicatorVariants = cva("block h-full rounded-full bg-primary", {
  variants: {
    variant: {
      default: "bg-primary",
      primary: "bg-primary",
      secondary: "bg-secondary-foreground",
      muted: "bg-muted-foreground",
      destructive: "bg-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type LoadingBarProps = React.ComponentProps<"div"> &
  VariantProps<typeof loadingBarVariants> &
  VariantProps<typeof loadingBarIndicatorVariants> & {
    value?: number | null;
    max?: number;
    label?: string;
    showValue?: boolean;
    indeterminate?: boolean;
  };

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getSafeMax(max: number | undefined) {
  return typeof max === "number" && Number.isFinite(max) && max > 0 ? max : 100;
}

function LoadingBar({
  className,
  value,
  max,
  size = "default",
  variant = "default",
  label = "Loading",
  showValue = false,
  indeterminate,
  "aria-label": ariaLabel,
  ...props
}: LoadingBarProps) {
  const safeMax = getSafeMax(max);
  const safeValue =
    typeof value === "number" && Number.isFinite(value) ? clampValue(value, 0, safeMax) : null;
  const isIndeterminate = indeterminate ?? safeValue === null;
  const percent = safeValue === null ? null : (safeValue / safeMax) * 100;

  return (
    <div
      data-slot="loading-bar"
      data-size={size}
      data-variant={variant}
      data-indeterminate={isIndeterminate ? "true" : "false"}
      role="progressbar"
      aria-label={ariaLabel ?? label}
      aria-valuemin={isIndeterminate ? undefined : 0}
      aria-valuemax={isIndeterminate ? undefined : safeMax}
      aria-valuenow={!isIndeterminate && safeValue !== null ? safeValue : undefined}
      className={cn(loadingBarVariants({ size }), className)}
      {...props}
    >
      <span
        data-slot="loading-bar-track"
        className="relative block h-[var(--loading-bar-height)] min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <span
          data-slot="loading-bar-indicator"
          className={cn(
            loadingBarIndicatorVariants({ variant }),
            isIndeterminate
              ? "absolute inset-y-0 left-0 w-1/3 [animation:ui-loading-bar_1.15s_ease-in-out_infinite]"
              : "size-full origin-left transition-transform duration-300 ease-out",
          )}
          style={isIndeterminate ? undefined : { transform: `scaleX(${(percent ?? 0) / 100})` }}
        />
      </span>
      {showValue && percent !== null ? (
        <span
          data-slot="loading-bar-value"
          className="min-w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground"
        >
          {Math.round(percent)}%
        </span>
      ) : null}
    </div>
  );
}

export { LoadingBar, loadingBarIndicatorVariants, loadingBarVariants };
export type { LoadingBarProps };
