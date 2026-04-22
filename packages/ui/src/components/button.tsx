"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { Slot } from "radix-ui";
import { cn } from "../lib/cn";
import { glassMotionTransition } from "../lib/motion";

const buttonVariants = cva(
  "inline-flex shrink-0 origin-bottom transform-gpu items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-[transform,box-shadow,background-color,color,border-color,filter] duration-150 ease-out will-change-transform hover:-translate-y-[1px] hover:scale-[1.055] active:brightness-110 disabled:pointer-events-none disabled:opacity-50 aria-[pressed=true]:-translate-y-[1px] aria-[pressed=true]:scale-[1.055] data-[selected=true]:-translate-y-[1px] data-[selected=true]:scale-[1.055] data-[state=on]:-translate-y-[1px] data-[state=on]:scale-[1.055] data-[keyboard-active=true]:scale-[0.98] data-[keyboard-active=true]:brightness-110 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_12px_28px_-14px_rgb(15_23_42_/_0.52)] hover:bg-primary/90 hover:shadow-[0_22px_42px_-18px_rgb(15_23_42_/_0.58)] active:bg-primary active:shadow-[0_8px_18px_-12px_rgb(15_23_42_/_0.42)] aria-[pressed=true]:bg-primary/90 aria-[pressed=true]:shadow-[0_22px_42px_-18px_rgb(15_23_42_/_0.58)] data-[selected=true]:bg-primary/90 data-[selected=true]:shadow-[0_22px_42px_-18px_rgb(15_23_42_/_0.58)] data-[state=on]:bg-primary/90 data-[state=on]:shadow-[0_22px_42px_-18px_rgb(15_23_42_/_0.58)] data-[keyboard-active=true]:bg-primary data-[keyboard-active=true]:shadow-[0_8px_18px_-12px_rgb(15_23_42_/_0.42)]",
        destructive:
          "bg-destructive text-white shadow-[0_12px_28px_-14px_rgb(127_29_29_/_0.45)] hover:bg-destructive/90 hover:shadow-[0_22px_42px_-18px_rgb(127_29_29_/_0.52)] active:bg-destructive active:shadow-[0_8px_18px_-12px_rgb(127_29_29_/_0.38)] focus-visible:ring-destructive/20 aria-[pressed=true]:bg-destructive/90 aria-[pressed=true]:shadow-[0_22px_42px_-18px_rgb(127_29_29_/_0.52)] data-[selected=true]:bg-destructive/90 data-[selected=true]:shadow-[0_22px_42px_-18px_rgb(127_29_29_/_0.52)] data-[state=on]:bg-destructive/90 data-[state=on]:shadow-[0_22px_42px_-18px_rgb(127_29_29_/_0.52)] data-[keyboard-active=true]:bg-destructive data-[keyboard-active=true]:shadow-[0_8px_18px_-12px_rgb(127_29_29_/_0.38)] dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-[0_10px_24px_-16px_rgb(15_23_42_/_0.3)] hover:bg-accent hover:text-accent-foreground hover:shadow-[0_18px_34px_-18px_rgb(15_23_42_/_0.34)] active:bg-accent active:text-accent-foreground active:shadow-[0_8px_18px_-14px_rgb(15_23_42_/_0.26)] aria-[pressed=true]:bg-accent aria-[pressed=true]:text-accent-foreground aria-[pressed=true]:shadow-[0_18px_34px_-18px_rgb(15_23_42_/_0.34)] data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[selected=true]:shadow-[0_18px_34px_-18px_rgb(15_23_42_/_0.34)] data-[state=on]:bg-accent data-[state=on]:text-accent-foreground data-[state=on]:shadow-[0_18px_34px_-18px_rgb(15_23_42_/_0.34)] data-[keyboard-active=true]:bg-accent data-[keyboard-active=true]:text-accent-foreground data-[keyboard-active=true]:shadow-[0_8px_18px_-14px_rgb(15_23_42_/_0.26)] dark:border-input dark:bg-input/30 dark:hover:bg-input/50 dark:active:bg-input",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_10px_24px_-16px_rgb(15_23_42_/_0.26)] hover:bg-secondary/80 hover:shadow-[0_18px_34px_-18px_rgb(15_23_42_/_0.32)] active:bg-secondary active:shadow-[0_8px_18px_-14px_rgb(15_23_42_/_0.24)] aria-[pressed=true]:bg-secondary/80 aria-[pressed=true]:shadow-[0_18px_34px_-18px_rgb(15_23_42_/_0.32)] data-[selected=true]:bg-secondary/80 data-[selected=true]:shadow-[0_18px_34px_-18px_rgb(15_23_42_/_0.32)] data-[state=on]:bg-secondary/80 data-[state=on]:shadow-[0_18px_34px_-18px_rgb(15_23_42_/_0.32)] data-[keyboard-active=true]:bg-secondary data-[keyboard-active=true]:shadow-[0_8px_18px_-14px_rgb(15_23_42_/_0.24)]",
        ghost:
          "shadow-none hover:bg-accent hover:text-accent-foreground hover:shadow-[0_14px_28px_-20px_rgb(15_23_42_/_0.28)] active:bg-accent active:text-accent-foreground active:shadow-[0_8px_18px_-16px_rgb(15_23_42_/_0.2)] aria-[pressed=true]:bg-accent aria-[pressed=true]:text-accent-foreground aria-[pressed=true]:shadow-[0_14px_28px_-20px_rgb(15_23_42_/_0.28)] data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[selected=true]:shadow-[0_14px_28px_-20px_rgb(15_23_42_/_0.28)] data-[state=on]:bg-accent data-[state=on]:text-accent-foreground data-[state=on]:shadow-[0_14px_28px_-20px_rgb(15_23_42_/_0.28)] data-[keyboard-active=true]:bg-accent data-[keyboard-active=true]:text-accent-foreground data-[keyboard-active=true]:shadow-[0_8px_18px_-16px_rgb(15_23_42_/_0.2)] dark:hover:bg-accent/50 dark:active:bg-accent",
        link: "text-primary underline-offset-4 shadow-none hover:translate-y-0 hover:scale-100 hover:underline hover:shadow-none active:text-primary active:shadow-none aria-[pressed=true]:translate-y-0 aria-[pressed=true]:scale-100 aria-[pressed=true]:underline aria-[pressed=true]:shadow-none data-[selected=true]:translate-y-0 data-[selected=true]:scale-100 data-[selected=true]:underline data-[selected=true]:shadow-none data-[state=on]:translate-y-0 data-[state=on]:scale-100 data-[state=on]:underline data-[state=on]:shadow-none data-[keyboard-active=true]:text-primary data-[keyboard-active=true]:shadow-none",
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

function Button(props: ButtonProps) {
  const {
    className,
    variant = "default",
    size = "default",
    asChild = false,
    dragX,
    onDrag,
    onBlur,
    onKeyDown,
    onKeyUp,
    disabled,
    ...rest
  } = props;

  const [keyboardActive, setKeyboardActive] = React.useState(false);
  const buttonClassName = cn(buttonVariants({ variant, size, className }));
  const legacyDragX = typeof onDrag === "boolean" ? onDrag : undefined;
  const enableDrag = Boolean(dragX ?? legacyDragX);
  const handleBlur = (event: React.FocusEvent<HTMLButtonElement>) => {
    setKeyboardActive(false);
    onBlur?.(event);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (!event.defaultPrevented && !disabled && event.key === "Enter") {
      setKeyboardActive(true);
    }
  };
  const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter") {
      setKeyboardActive(false);
    }
    onKeyUp?.(event);
  };

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        data-keyboard-active={keyboardActive ? true : undefined}
        className={buttonClassName}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        {...(rest as Record<string, unknown>)}
      />
    );
  }

  return (
    <motion.button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-keyboard-active={keyboardActive ? true : undefined}
      className={buttonClassName}
      disabled={disabled}
      drag={enableDrag ? "x" : undefined}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      transition={glassMotionTransition}
      whileHover={{ y: -1, scale: 1.055 }}
      whileTap={{ scale: 0.98 }}
      {...(rest as Record<string, unknown>)}
    />
  );
}

export { Button, buttonVariants };
