import * as React from "react";

import { cn } from "../lib/cn";

function Timeline({ className, ...props }: React.ComponentProps<"ol">) {
  return <ol data-slot="timeline" className={cn("grid gap-0 text-sm", className)} {...props} />;
}

function TimelineItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="timeline-item"
      className={cn("group/timeline-item grid grid-cols-[1rem_1fr] gap-3", className)}
      {...props}
    />
  );
}

function TimelineIndicator({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      data-slot="timeline-indicator"
      className={cn(
        "mt-1.5 size-2.5 border border-primary bg-primary ring-4 ring-primary/15",
        className,
      )}
      {...props}
    />
  );
}

function TimelineConnector({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      data-slot="timeline-connector"
      className={cn(
        "mx-auto h-full min-h-6 w-px bg-border group-last/timeline-item:hidden",
        className,
      )}
      {...props}
    />
  );
}

function TimelineContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="timeline-content" className={cn("grid gap-1 pb-5", className)} {...props} />
  );
}

function TimelineTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="timeline-title" className={cn("font-medium leading-5", className)} {...props} />
  );
}

function TimelineDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="timeline-description"
      className={cn("leading-5 text-muted-foreground", className)}
      {...props}
    />
  );
}

function TimelineTime({ className, ...props }: React.ComponentProps<"time">) {
  return (
    <time
      data-slot="timeline-time"
      className={cn("text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineIndicator,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
};
