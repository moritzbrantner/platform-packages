"use client";

import * as React from "react";
import { XIcon } from "lucide-react";

import { cn } from "../lib/cn";
import { ActionBar } from "./app-layout";
import { Button } from "./button";

type SelectionToolbarProps = React.ComponentProps<"div"> & {
  selectedCount: number;
  totalCount?: number;
  label?: React.ReactNode;
  clearLabel?: string;
  onClearSelection?: () => void;
  sticky?: boolean;
};

function SelectionToolbar({
  selectedCount,
  totalCount,
  label,
  clearLabel = "Clear selection",
  onClearSelection,
  sticky = false,
  className,
  children,
  ...props
}: SelectionToolbarProps) {
  if (selectedCount <= 0) {
    return null;
  }

  const defaultLabel =
    totalCount === undefined
      ? `${selectedCount} selected`
      : `${selectedCount} of ${totalCount} selected`;

  return (
    <ActionBar
      data-slot="selection-toolbar"
      align="between"
      sticky={sticky}
      className={cn(
        "rounded-md border border-border/60 bg-card/80 px-3 py-2 text-card-foreground",
        className,
      )}
      {...props}
    >
      <div data-slot="selection-toolbar-label" className="text-sm font-medium">
        {label ?? defaultLabel}
      </div>
      <SelectionToolbarActions>
        {children}
        {onClearSelection ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClearSelection}>
            <XIcon />
            {clearLabel}
          </Button>
        ) : null}
      </SelectionToolbarActions>
    </ActionBar>
  );
}

function SelectionToolbarActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="selection-toolbar-actions"
      className={cn("flex flex-wrap items-center justify-end gap-2", className)}
      {...props}
    />
  );
}

export { SelectionToolbar, SelectionToolbarActions, type SelectionToolbarProps };
