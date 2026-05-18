import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";
import { Separator } from "./separator";

const toolbarVariants = cva(
  "flex min-h-[var(--ui-toolbar-min-height)] w-full flex-wrap items-center gap-[var(--ui-toolbar-gap,var(--ui-control-gap))] border border-border/60 bg-card/70 px-[var(--ui-toolbar-padding-x)] py-[var(--ui-toolbar-padding-y)] text-sm shadow-[var(--ui-shadow-surface)] supports-backdrop-filter:backdrop-blur-xl",
  {
    variants: {
      justify: {
        start: "justify-start",
        between: "justify-between",
        end: "justify-end",
      },
      density: {
        default: "min-h-[var(--ui-toolbar-min-height)]",
        compact:
          "min-h-[var(--ui-control-height-md)] px-[var(--ui-control-padding-x-sm)] py-[var(--ui-menu-item-padding-y)]",
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
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-[var(--ui-toolbar-gap,var(--ui-control-gap))]",
        className,
      )}
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
  return <div data-slot="toolbar-spacer" className={cn("min-w-2 flex-1", className)} {...props} />;
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

export { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSpacer, ToolbarSeparator, toolbarVariants };
