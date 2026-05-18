"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "motion/react";

import { cn } from "../lib/cn";
import { glassSurfaceMotion } from "../lib/motion";

function Card({
  className,
  size = "default",
  layout = glassSurfaceMotion.layout,
  transition = glassSurfaceMotion.transition,
  ...props
}: HTMLMotionProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <motion.div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-[var(--ui-card-gap,var(--ui-surface-gap))] overflow-hidden rounded-[var(--ui-card-radius,var(--ui-radius-surface))] bg-card py-[var(--ui-card-padding,var(--ui-surface-padding-md))] text-sm text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-[var(--ui-surface-padding-sm)] data-[size=sm]:py-[var(--ui-surface-padding-sm)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-[var(--ui-card-radius,var(--ui-radius-surface))] *:[img:last-child]:rounded-b-[var(--ui-card-radius,var(--ui-radius-surface))]",
        className,
      )}
      layout={layout}
      transition={transition}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-[var(--ui-card-radius,var(--ui-radius-surface))] px-[var(--ui-card-padding,var(--ui-surface-padding-md))] group-data-[size=sm]/card:px-[var(--ui-surface-padding-sm)] has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-[var(--ui-card-padding,var(--ui-surface-padding-md))] group-data-[size=sm]/card:[.border-b]:pb-[var(--ui-surface-padding-sm)]",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "px-[var(--ui-card-padding,var(--ui-surface-padding-md))] group-data-[size=sm]/card:px-[var(--ui-surface-padding-sm)]",
        className,
      )}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-[var(--ui-card-radius,var(--ui-radius-surface))] border-t bg-muted/50 p-[var(--ui-card-padding,var(--ui-surface-padding-md))] group-data-[size=sm]/card:p-[var(--ui-surface-padding-sm)]",
        className,
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
