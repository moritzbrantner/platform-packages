import * as React from "react";
import { UploadIcon } from "lucide-react";

import { cn } from "../lib/cn";

function Dropzone({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="dropzone"
      className={cn(
        "group/dropzone flex min-h-36 w-full cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-border/70 bg-muted/25 px-4 py-6 text-center text-sm transition-colors hover:bg-muted/40 has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-focus-visible:border-ring has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

function DropzoneInput({ className, type = "file", ...props }: React.ComponentProps<"input">) {
  return (
    <input data-slot="dropzone-input" type={type} className={cn("sr-only", className)} {...props} />
  );
}

function DropzoneIcon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropzone-icon"
      className={cn(
        "flex size-10 items-center justify-center rounded-md border border-border/60 bg-background/70 text-muted-foreground shadow-[var(--glass-interactive-shadow)] [&_svg:not([class*='size-'])]:size-5",
        className,
      )}
      {...props}
    />
  );
}

function DropzoneContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="dropzone-content" className={cn("grid max-w-sm gap-1", className)} {...props} />
  );
}

function DropzoneTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropzone-title"
      className={cn("font-medium leading-snug", className)}
      {...props}
    />
  );
}

function DropzoneDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="dropzone-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}

function DropzoneDefaultIcon(props: React.ComponentProps<typeof UploadIcon>) {
  return <UploadIcon aria-hidden="true" {...props} />;
}

export {
  Dropzone,
  DropzoneInput,
  DropzoneIcon,
  DropzoneContent,
  DropzoneTitle,
  DropzoneDescription,
  DropzoneDefaultIcon,
};
