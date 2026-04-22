import * as React from "react";
import { CheckIcon } from "lucide-react";

import { cn } from "../lib/cn";

type StepperOrientation = "horizontal" | "vertical";
type StepperStatus = "complete" | "current" | "incomplete" | "error";

type StepperProps = React.ComponentProps<"ol"> & {
  orientation?: StepperOrientation;
};

function Stepper({ className, orientation = "horizontal", ...props }: StepperProps) {
  return (
    <ol
      data-slot="stepper"
      data-orientation={orientation}
      className={cn(
        "group/stepper grid w-full gap-4 data-[orientation=horizontal]:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] data-[orientation=vertical]:grid-cols-1",
        className,
      )}
      {...props}
    />
  );
}

type StepperItemProps = React.ComponentProps<"li"> & {
  status?: StepperStatus;
};

function StepperItem({ className, status = "incomplete", ...props }: StepperItemProps) {
  return (
    <li
      data-slot="stepper-item"
      data-status={status}
      className={cn(
        "group/stepper-item relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 group-data-[orientation=horizontal]/stepper:grid-cols-1",
        className,
      )}
      {...props}
    />
  );
}

function StepperIndicator({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stepper-indicator"
      className={cn(
        "relative z-10 flex size-7 items-center justify-center border border-border bg-background text-xs font-medium text-muted-foreground shadow-[var(--glass-interactive-shadow)] group-data-[status=complete]/stepper-item:border-primary/50 group-data-[status=complete]/stepper-item:bg-primary group-data-[status=complete]/stepper-item:text-primary-foreground group-data-[status=current]/stepper-item:border-primary group-data-[status=current]/stepper-item:text-primary group-data-[status=error]/stepper-item:border-destructive group-data-[status=error]/stepper-item:text-destructive",
        className,
      )}
      {...props}
    >
      {children ?? (
        <CheckIcon
          aria-hidden="true"
          className="hidden size-3.5 group-data-[status=complete]/stepper-item:block"
        />
      )}
    </div>
  );
}

function StepperContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stepper-content"
      className={cn("min-w-0 pt-0.5 group-data-[orientation=horizontal]/stepper:pt-0", className)}
      {...props}
    />
  );
}

function StepperTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stepper-title"
      className={cn(
        "truncate text-sm font-medium leading-snug group-data-[status=current]/stepper-item:text-primary group-data-[status=error]/stepper-item:text-destructive",
        className,
      )}
      {...props}
    />
  );
}

function StepperDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="stepper-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}

function StepperConnector({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="stepper-connector"
      className={cn(
        "bg-border group-data-[status=complete]/stepper-item:bg-primary group-data-[orientation=vertical]/stepper:col-start-1 group-data-[orientation=vertical]/stepper:row-start-2 group-data-[orientation=vertical]/stepper:min-h-5 group-data-[orientation=vertical]/stepper:w-px group-data-[orientation=vertical]/stepper:justify-self-center group-data-[orientation=horizontal]/stepper:absolute group-data-[orientation=horizontal]/stepper:left-9 group-data-[orientation=horizontal]/stepper:right-2 group-data-[orientation=horizontal]/stepper:top-3.5 group-data-[orientation=horizontal]/stepper:z-0 group-data-[orientation=horizontal]/stepper:h-px",
        className,
      )}
      {...props}
    />
  );
}

export {
  Stepper,
  StepperItem,
  StepperIndicator,
  StepperContent,
  StepperTitle,
  StepperDescription,
  StepperConnector,
};
export type { StepperOrientation, StepperStatus };
