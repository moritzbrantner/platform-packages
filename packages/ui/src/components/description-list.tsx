import * as React from "react";

import { cn } from "../lib/cn";

function DescriptionList({ className, ...props }: React.ComponentProps<"dl">) {
  return (
    <dl data-slot="description-list" className={cn("grid gap-3 text-sm", className)} {...props} />
  );
}

function DescriptionListItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="description-list-item"
      className={cn(
        "grid gap-1 border-b pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[11rem_1fr] sm:gap-4",
        className,
      )}
      {...props}
    />
  );
}

function DescriptionListTerm({ className, ...props }: React.ComponentProps<"dt">) {
  return (
    <dt
      data-slot="description-list-term"
      className={cn("font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

function DescriptionListDetail({ className, ...props }: React.ComponentProps<"dd">) {
  return (
    <dd
      data-slot="description-list-detail"
      className={cn("min-w-0 text-foreground", className)}
      {...props}
    />
  );
}

export { DescriptionList, DescriptionListDetail, DescriptionListItem, DescriptionListTerm };
