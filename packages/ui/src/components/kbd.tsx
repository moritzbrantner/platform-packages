"use client";

import { motion, type HTMLMotionProps } from "motion/react";

import { cn } from "../lib/cn";
import { glassSurfaceMotion } from "../lib/motion";

function Kbd({
  className,
  layout = glassSurfaceMotion.layout,
  transition = glassSurfaceMotion.transition,
  ...props
}: HTMLMotionProps<"kbd">) {
  return (
    <motion.kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground select-none in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 [&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      layout={layout}
      transition={transition}
      {...props}
    />
  );
}

function KbdGroup({
  className,
  layout = glassSurfaceMotion.layout,
  transition = glassSurfaceMotion.transition,
  ...props
}: HTMLMotionProps<"kbd">) {
  return (
    <motion.kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      layout={layout}
      transition={transition}
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
