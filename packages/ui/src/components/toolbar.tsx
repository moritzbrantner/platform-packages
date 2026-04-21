import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";
import { Separator } from "./separator";

const toolbarVariants = cva(
  "flex min-h-11 w-full flex-wrap items-center gap-2 border border-border/60 bg-card/70 px-3 py-2 text-sm shadow-[var(--glass-shadow)] supports-backdrop-filter:backdrop-blur-xl",
  {
    variants: {
      justify: {
        start: "justify-start",
        between: "justify-between",
        end: "justify-end",
      },
      density: {
        default: "min-h-11",
        compact: "min-h-9 px-2 py-1.5",
      },
    },
    defaultVariants: {
      justify: "start",
      density: "default",
    },
  },
);

function Toolbar({
  className,
  justify = "start",
  density = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof toolbarVariants>) {
  return (
    <div
      role="toolbar"
      data-slot="toolbar"
      data-justify={justify}
      data-density={density}
      className={cn(toolbarVariants({ justify, density }), className)}
      {...props}
    />
  );
}

function ToolbarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="toolbar-group"
      className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

function ToolbarTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toolbar-title"
      className={cn("truncate text-sm font-medium", className)}
      {...props}
    />
  );
}

function ToolbarSpacer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toolbar-spacer"
      className={cn("min-w-2 flex-1", className)}
      {...props}
    />
  );
}

function ToolbarSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="toolbar-separator"
      orientation={orientation}
      className={cn(
        "mx-1 h-6 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px",
        className,
      )}
      {...props}
    />
  );
}

export {
  Toolbar,
  ToolbarGroup,
  ToolbarTitle,
  ToolbarSpacer,
  ToolbarSeparator,
  toolbarVariants,
};

