import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../lib/cn";

const pageShellVariants = cva("min-h-screen bg-background text-foreground", {
  variants: {
    background: {
      default:
        "relative overflow-hidden [background-image:radial-gradient(circle_at_15%_18%,color-mix(in_oklch,var(--primary)_16%,transparent)_0%,transparent_30%),radial-gradient(circle_at_84%_10%,color-mix(in_oklch,var(--chart-2)_14%,transparent)_0%,transparent_26%)]",
      muted: "bg-muted/30",
      none: "bg-transparent",
    },
  },
  defaultVariants: {
    background: "default",
  },
});

const pageShellInnerVariants = cva("mx-auto flex w-full flex-col", {
  variants: {
    maxWidth: {
      default: "max-w-7xl",
      wide: "max-w-[90rem]",
      full: "max-w-none",
    },
    padding: {
      default: "gap-6 px-4 py-8 md:px-8",
      compact: "gap-4 px-4 py-5 md:px-6",
      none: "gap-0",
    },
  },
  defaultVariants: {
    maxWidth: "default",
    padding: "default",
  },
});

type PageShellProps = React.ComponentProps<"div"> & {
  maxWidth?: "default" | "wide" | "full";
  padding?: "default" | "compact" | "none";
  background?: "default" | "muted" | "none";
};

function PageShell({
  className,
  children,
  maxWidth = "default",
  padding = "default",
  background = "default",
  ...props
}: PageShellProps) {
  return (
    <div
      data-slot="page-shell"
      data-background={background}
      className={cn(pageShellVariants({ background }), className)}
      {...props}
    >
      <div
        data-slot="page-shell-inner"
        data-max-width={maxWidth}
        data-padding={padding}
        className={cn(pageShellInnerVariants({ maxWidth, padding }))}
      >
        {children}
      </div>
    </div>
  );
}

const pageHeaderVariants = cva(
  "group/page-header @container/page-header grid gap-[var(--ui-surface-gap)] rounded-[var(--ui-radius-surface)] border border-border/60 bg-card/60 p-[var(--ui-surface-padding-md)] text-card-foreground shadow-[var(--ui-shadow-surface)] supports-backdrop-filter:backdrop-blur-xl md:p-[calc(var(--ui-surface-padding-md)+0.25rem)]",
  {
    variants: {
      align: {
        start: "@md/page-header:grid-cols-[minmax(0,1fr)_auto] @md/page-header:items-start",
        center:
          "justify-items-center text-center @md/page-header:mx-auto @md/page-header:max-w-3xl",
      },
    },
    defaultVariants: {
      align: "start",
    },
  },
);

type PageHeaderProps = React.ComponentProps<"header"> & {
  align?: "start" | "center";
};

function PageHeader({ className, align = "start", ...props }: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      data-align={align}
      className={cn(pageHeaderVariants({ align }), className)}
      {...props}
    />
  );
}

function PageTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="page-title"
      className={cn(
        "max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-balance md:text-4xl",
        className,
      )}
      {...props}
    />
  );
}

function PageDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="page-description"
      className={cn("max-w-3xl text-sm leading-6 text-muted-foreground md:text-base", className)}
      {...props}
    />
  );
}

function PageActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-actions"
      className={cn(
        "flex flex-wrap items-center gap-2 group-data-[align=center]/page-header:justify-center @md/page-header:group-data-[align=start]/page-header:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function PageContent({ className, ...props }: React.ComponentProps<"main">) {
  return <main data-slot="page-content" className={cn("grid gap-6", className)} {...props} />;
}

const surfaceVariants = cva(
  "group/surface relative isolate overflow-hidden rounded-[var(--ui-radius-surface)] border text-sm shadow-[var(--ui-shadow-surface)]",
  {
    variants: {
      variant: {
        default:
          "border-border/60 bg-card/70 text-card-foreground supports-backdrop-filter:backdrop-blur-xl",
        muted:
          "border-border/50 bg-muted/35 text-foreground supports-backdrop-filter:backdrop-blur-lg",
        transparent: "border-border/40 bg-transparent text-foreground shadow-none",
      },
      padding: {
        default: "py-[var(--ui-surface-padding-md)]",
        compact: "py-[var(--ui-surface-padding-sm)]",
        none: "py-0",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  },
);

type SurfaceProps = React.ComponentProps<"section"> & {
  variant?: "default" | "muted" | "transparent";
  padding?: "default" | "compact" | "none";
};

function Surface({ className, variant = "default", padding = "default", ...props }: SurfaceProps) {
  return (
    <section
      data-slot="surface"
      data-variant={variant}
      data-padding={padding}
      className={cn(surfaceVariants({ variant, padding }), className)}
      {...props}
    />
  );
}

function SurfaceHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="surface-header"
      className={cn(
        "grid auto-rows-min items-start gap-1 px-[var(--ui-surface-padding-md)] group-data-[padding=compact]/surface:px-[var(--ui-surface-padding-sm)] group-data-[padding=none]/surface:px-0 has-data-[slot=surface-action]:grid-cols-[1fr_auto] has-data-[slot=surface-description]:grid-rows-[auto_auto]",
        className,
      )}
      {...props}
    />
  );
}

function SurfaceTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="surface-title"
      className={cn("text-base font-medium leading-snug", className)}
      {...props}
    />
  );
}

function SurfaceDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="surface-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}

function SurfaceAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="surface-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function SurfaceContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="surface-content"
      className={cn(
        "px-[var(--ui-surface-padding-md)] group-data-[padding=compact]/surface:px-[var(--ui-surface-padding-sm)] group-data-[padding=none]/surface:px-0",
        className,
      )}
      {...props}
    />
  );
}

function SurfaceFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="surface-footer"
      className={cn(
        "mt-[var(--ui-surface-gap)] flex flex-wrap items-center gap-[var(--ui-control-gap)] border-t border-border/60 bg-muted/35 px-[var(--ui-surface-padding-md)] pt-[var(--ui-surface-padding-md)] group-data-[padding=compact]/surface:mt-[var(--ui-surface-padding-sm)] group-data-[padding=compact]/surface:px-[var(--ui-surface-padding-sm)] group-data-[padding=compact]/surface:pt-[var(--ui-surface-padding-sm)] group-data-[padding=none]/surface:mt-0 group-data-[padding=none]/surface:px-0",
        className,
      )}
      {...props}
    />
  );
}

const sectionGridVariants = cva("grid", {
  variants: {
    columns: {
      one: "grid-cols-1",
      two: "grid-cols-1 lg:grid-cols-2",
      three: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
      "sidebar-left": "grid-cols-1 xl:grid-cols-[0.82fr_1.18fr]",
      "sidebar-right": "grid-cols-1 xl:grid-cols-[1.18fr_0.82fr]",
    },
    gap: {
      default: "gap-4",
      compact: "gap-3",
      loose: "gap-6",
    },
  },
  defaultVariants: {
    columns: "two",
    gap: "default",
  },
});

type SectionGridProps = React.ComponentProps<"div"> & {
  columns?: "one" | "two" | "three" | "sidebar-left" | "sidebar-right";
  gap?: "default" | "compact" | "loose";
};

function SectionGrid({ className, columns = "two", gap = "default", ...props }: SectionGridProps) {
  return (
    <div
      data-slot="section-grid"
      data-columns={columns}
      data-gap={gap}
      className={cn(sectionGridVariants({ columns, gap }), className)}
      {...props}
    />
  );
}

const actionBarVariants = cva("flex flex-wrap items-center gap-2", {
  variants: {
    align: {
      start: "justify-start",
      end: "justify-end",
      between: "justify-between",
    },
    sticky: {
      true: "sticky bottom-0 z-10 border-t border-border/60 bg-background/80 p-3 shadow-[var(--glass-shadow)] supports-backdrop-filter:backdrop-blur-xl",
      false: "",
    },
  },
  defaultVariants: {
    align: "end",
    sticky: false,
  },
});

type ActionBarProps = React.ComponentProps<"div"> & {
  align?: "start" | "end" | "between";
  sticky?: boolean;
};

function ActionBar({ className, align = "end", sticky = false, ...props }: ActionBarProps) {
  return (
    <div
      data-slot="action-bar"
      data-align={align}
      data-sticky={sticky}
      className={cn(actionBarVariants({ align, sticky }), className)}
      {...props}
    />
  );
}

export {
  ActionBar,
  PageActions,
  PageContent,
  PageDescription,
  PageHeader,
  PageShell,
  PageTitle,
  SectionGrid,
  Surface,
  SurfaceAction,
  SurfaceContent,
  SurfaceDescription,
  SurfaceFooter,
  SurfaceHeader,
  SurfaceTitle,
};
export type { ActionBarProps, PageHeaderProps, PageShellProps, SectionGridProps, SurfaceProps };
