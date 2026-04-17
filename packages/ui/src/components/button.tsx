"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { Slot } from "radix-ui";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  "inline-flex shrink-0 transform-gpu items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-[transform,box-shadow,background-color,color,border-color] duration-200 ease-out will-change-transform hover:-translate-y-1 hover:scale-[1.03] active:translate-y-0.5 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_12px_28px_-14px_rgb(15_23_42_/_0.52)] hover:bg-primary/90 hover:shadow-[0_22px_42px_-18px_rgb(15_23_42_/_0.58)] active:shadow-[0_8px_18px_-12px_rgb(15_23_42_/_0.42)]",
        destructive:
          "bg-destructive text-white shadow-[0_12px_28px_-14px_rgb(127_29_29_/_0.45)] hover:bg-destructive/90 hover:shadow-[0_22px_42px_-18px_rgb(127_29_29_/_0.52)] active:shadow-[0_8px_18px_-12px_rgb(127_29_29_/_0.38)] focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-[0_10px_24px_-16px_rgb(15_23_42_/_0.3)] hover:bg-accent hover:text-accent-foreground hover:shadow-[0_18px_34px_-18px_rgb(15_23_42_/_0.34)] active:shadow-[0_8px_18px_-14px_rgb(15_23_42_/_0.26)] dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_10px_24px_-16px_rgb(15_23_42_/_0.26)] hover:bg-secondary/80 hover:shadow-[0_18px_34px_-18px_rgb(15_23_42_/_0.32)] active:shadow-[0_8px_18px_-14px_rgb(15_23_42_/_0.24)]",
        ghost:
          "shadow-none hover:bg-accent hover:text-accent-foreground hover:shadow-[0_14px_28px_-20px_rgb(15_23_42_/_0.28)] active:shadow-[0_8px_18px_-16px_rgb(15_23_42_/_0.2)] dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 shadow-none hover:translate-y-0 hover:scale-100 hover:underline hover:shadow-none active:translate-y-0 active:scale-100 active:shadow-none",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type SharedProps = VariantProps<typeof buttonVariants> & {
  className?: string;
  asChild?: boolean;
  dragX?: boolean;
  // Backward-compatible alias for horizontal drag support.
  onDrag?: React.ComponentProps<"button">["onDrag"] | boolean;
};

type ButtonProps = SharedProps & React.ComponentProps<"button">;

function updateCursorGlowPosition(
  event:
    | React.PointerEvent<HTMLButtonElement>
    | React.PointerEvent<HTMLElement>,
) {
  const target = event.currentTarget as HTMLElement;
  const bounds = target.getBoundingClientRect();

  target.style.setProperty(
    "--glass-cursor-x",
    `${event.clientX - bounds.left}px`,
  );
  target.style.setProperty(
    "--glass-cursor-y",
    `${event.clientY - bounds.top}px`,
  );
}

function resetCursorGlowPosition(
  event:
    | React.PointerEvent<HTMLButtonElement>
    | React.PointerEvent<HTMLElement>,
) {
  const target = event.currentTarget as HTMLElement;
  target.style.removeProperty("--glass-cursor-x");
  target.style.removeProperty("--glass-cursor-y");
}

function Button(props: ButtonProps) {
  const {
    className,
    variant = "default",
    size = "default",
    asChild = false,
    dragX,
    onDrag,
    onPointerEnter,
    onPointerMove,
    onPointerDown,
    onPointerLeave,
    ...rest
  } = props;

  const buttonClassName = cn(buttonVariants({ variant, size, className }));
  const legacyDragX = typeof onDrag === "boolean" ? onDrag : undefined;
  const enableDrag = Boolean(dragX ?? legacyDragX);

  const sharedHandlers = {
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
      updateCursorGlowPosition(event);
      onPointerEnter?.(event as React.PointerEvent<HTMLButtonElement>);
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      updateCursorGlowPosition(event);
      onPointerMove?.(event as React.PointerEvent<HTMLButtonElement>);
    },
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      updateCursorGlowPosition(event);
      onPointerDown?.(event as React.PointerEvent<HTMLButtonElement>);
    },
    onPointerLeave: (event: React.PointerEvent<HTMLElement>) => {
      resetCursorGlowPosition(event);
      onPointerLeave?.(event as React.PointerEvent<HTMLButtonElement>);
    },
  };

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={buttonClassName}
        {...sharedHandlers}
        {...(rest as Record<string, unknown>)}
      />
    );
  }

  return (
    <motion.button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={buttonClassName}
      {...sharedHandlers}
      drag={enableDrag ? "x" : undefined}
      {...(rest as Record<string, unknown>)}
    />
  );
}

export { Button, buttonVariants };
