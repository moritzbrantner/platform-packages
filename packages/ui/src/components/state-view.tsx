"use client";

import * as React from "react";
import { CheckCircle2Icon, CloudOffIcon, FileQuestionIcon, TriangleAlertIcon } from "lucide-react";
import { cva } from "class-variance-authority";

import { cn } from "../lib/cn";
import { Spinner } from "./spinner";

type StateViewVariant = "empty" | "loading" | "error" | "offline" | "success";
type StateViewSize = "sm" | "default" | "lg";

type StateViewProps = React.ComponentProps<"div"> & {
  variant?: StateViewVariant;
  size?: StateViewSize;
};

type LoadingStateProps = StateViewProps & {
  label?: React.ReactNode;
};

const stateViewVariants = cva(
  "flex w-full min-w-0 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 text-center text-sm text-muted-foreground",
  {
    variants: {
      size: {
        sm: "min-h-28 p-4",
        default: "min-h-40 p-6",
        lg: "min-h-56 p-8",
      },
      variant: {
        empty: "",
        loading: "",
        error: "border-destructive/35 bg-destructive/5 text-destructive",
        offline: "border-border bg-muted/35",
        success: "border-primary/30 bg-primary/5 text-primary",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "empty",
    },
  },
);

const defaultRoleByVariant: Partial<Record<StateViewVariant, "status" | "alert">> = {
  loading: "status",
  error: "alert",
  offline: "alert",
};

function StateView({
  className,
  variant = "empty",
  size = "default",
  role,
  ...props
}: StateViewProps) {
  return (
    <div
      data-slot="state-view"
      data-variant={variant}
      data-size={size}
      role={role ?? defaultRoleByVariant[variant]}
      className={cn(stateViewVariants({ variant, size }), className)}
      {...props}
    />
  );
}

function StateViewMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="state-view-media"
      className={cn(
        "grid size-10 place-items-center rounded-full bg-background text-muted-foreground ring-1 ring-border/70 data-[variant=error]:text-destructive data-[variant=success]:text-primary",
        className,
      )}
      {...props}
    />
  );
}

function StateViewTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="state-view-title"
      className={cn("text-base font-medium leading-snug text-foreground", className)}
      {...props}
    />
  );
}

function StateViewDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="state-view-description"
      className={cn("max-w-sm text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}

function StateViewActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="state-view-actions"
      className={cn("mt-1 flex flex-wrap items-center justify-center gap-2", className)}
      {...props}
    />
  );
}

function EmptyState({ children, ...props }: StateViewProps) {
  return (
    <StateView variant="empty" {...props}>
      {children ?? (
        <>
          <StateViewMedia>
            <FileQuestionIcon aria-hidden="true" className="size-5" />
          </StateViewMedia>
          <StateViewTitle>No results</StateViewTitle>
        </>
      )}
    </StateView>
  );
}

function LoadingState({ children, label = "Loading", ...props }: LoadingStateProps) {
  return (
    <StateView variant="loading" {...props}>
      {children ?? (
        <>
          <StateViewMedia>
            <Spinner decorative size="default" variant="muted" />
          </StateViewMedia>
          <StateViewTitle>{label}</StateViewTitle>
        </>
      )}
    </StateView>
  );
}

function ErrorState({ children, ...props }: StateViewProps) {
  return (
    <StateView variant="error" {...props}>
      {children ?? (
        <>
          <StateViewMedia>
            <TriangleAlertIcon aria-hidden="true" className="size-5" />
          </StateViewMedia>
          <StateViewTitle>Something went wrong</StateViewTitle>
        </>
      )}
    </StateView>
  );
}

function OfflineState({ children, ...props }: StateViewProps) {
  return (
    <StateView variant="offline" {...props}>
      {children ?? (
        <>
          <StateViewMedia>
            <CloudOffIcon aria-hidden="true" className="size-5" />
          </StateViewMedia>
          <StateViewTitle>Offline</StateViewTitle>
        </>
      )}
    </StateView>
  );
}

function SuccessState({ children, ...props }: StateViewProps) {
  return (
    <StateView variant="success" {...props}>
      {children ?? (
        <>
          <StateViewMedia>
            <CheckCircle2Icon aria-hidden="true" className="size-5" />
          </StateViewMedia>
          <StateViewTitle>Complete</StateViewTitle>
        </>
      )}
    </StateView>
  );
}

export {
  EmptyState,
  ErrorState,
  LoadingState,
  OfflineState,
  StateView,
  StateViewActions,
  StateViewDescription,
  StateViewMedia,
  StateViewTitle,
  SuccessState,
  type LoadingStateProps,
  type StateViewProps,
  type StateViewSize,
  type StateViewVariant,
};
