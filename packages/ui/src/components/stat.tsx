import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";

function StatGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="list"
      data-slot="stat-group"
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}
      {...props}
    />
  );
}

function Stat({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="listitem"
      data-slot="stat"
      className={cn("grid gap-2 border bg-card p-4 text-card-foreground shadow-sm", className)}
      {...props}
    />
  );
}

function StatLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-label"
      className={cn("text-sm font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

function StatValue({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-value"
      className={cn("text-2xl font-semibold tabular-nums", className)}
      {...props}
    />
  );
}

const statDeltaVariants = cva(
  "inline-flex w-fit items-center gap-1 text-xs font-medium tabular-nums",
  {
    variants: {
      variant: {
        neutral: "text-muted-foreground",
        positive: "text-emerald-700 dark:text-emerald-400",
        negative: "text-destructive",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

function StatDelta({
  className,
  variant = "neutral",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof statDeltaVariants>) {
  return (
    <div
      data-slot="stat-delta"
      data-variant={variant}
      className={cn(statDeltaVariants({ variant, className }))}
      {...props}
    />
  );
}

function StatDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="stat-description"
      className={cn("text-sm leading-5 text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Stat, StatDelta, StatDescription, StatGroup, StatLabel, StatValue, statDeltaVariants };
