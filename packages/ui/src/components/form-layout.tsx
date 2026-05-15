import * as React from "react";
import { TriangleAlertIcon } from "lucide-react";
import { cva } from "class-variance-authority";

import { cn } from "../lib/cn";
import { ActionBar } from "./app-layout";

function FormSection({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="form-section"
      className={cn("grid gap-4 rounded-md border border-border/60 bg-card/70 p-4", className)}
      {...props}
    />
  );
}

function FormSectionHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="form-section-header" className={cn("grid gap-1", className)} {...props} />
  );
}

function FormSectionTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="form-section-title"
      className={cn("text-base font-medium leading-snug", className)}
      {...props}
    />
  );
}

function FormSectionDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="form-section-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}

function Fieldset({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="fieldset"
      className={cn("grid min-w-0 gap-3 disabled:opacity-60", className)}
      {...props}
    />
  );
}

const fieldGridVariants = cva("grid gap-4", {
  variants: {
    columns: {
      one: "grid-cols-1",
      two: "grid-cols-1 md:grid-cols-2",
      three: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
    },
  },
  defaultVariants: {
    columns: "two",
  },
});

function FieldGrid({
  className,
  columns = "two",
  ...props
}: React.ComponentProps<"div"> & {
  columns?: "one" | "two" | "three";
}) {
  return (
    <div
      data-slot="field-grid"
      data-columns={columns}
      className={cn(fieldGridVariants({ columns }), className)}
      {...props}
    />
  );
}

const fieldRowVariants = cva("flex flex-wrap gap-3", {
  variants: {
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
    },
  },
  defaultVariants: {
    align: "start",
  },
});

function FieldRow({
  className,
  align = "start",
  ...props
}: React.ComponentProps<"div"> & {
  align?: "start" | "center" | "end";
}) {
  return (
    <div
      data-slot="field-row"
      data-align={align}
      className={cn(fieldRowVariants({ align }), className)}
      {...props}
    />
  );
}

function FormActions({
  className,
  align = "end",
  sticky = false,
  ...props
}: React.ComponentProps<"div"> & {
  align?: "start" | "end" | "between";
  sticky?: boolean;
}) {
  return (
    <ActionBar
      data-slot="form-actions"
      align={align}
      sticky={sticky}
      className={cn("rounded-md", className)}
      {...props}
    />
  );
}

function ValidationSummary({
  className,
  title = "Please review the following",
  errors = [],
  children,
  ...props
}: React.ComponentProps<"div"> & {
  title?: React.ReactNode;
  errors?: readonly React.ReactNode[];
}) {
  if (errors.length === 0 && !children) {
    return null;
  }

  return (
    <div
      data-slot="validation-summary"
      role="alert"
      className={cn(
        "grid gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-foreground",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2 font-medium">
        <TriangleAlertIcon aria-hidden="true" className="size-4 text-destructive" />
        <span>{title}</span>
      </div>
      {errors.length ? (
        <ul className="grid gap-1 pl-6 text-sm text-foreground">
          {errors.map((error, index) => (
            <li key={index} className="list-disc">
              {error}
            </li>
          ))}
        </ul>
      ) : (
        children
      )}
    </div>
  );
}

export {
  FieldGrid,
  FieldRow,
  Fieldset,
  FormActions,
  FormSection,
  FormSectionDescription,
  FormSectionHeader,
  FormSectionTitle,
  ValidationSummary,
};
