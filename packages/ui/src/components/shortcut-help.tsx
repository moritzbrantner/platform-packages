"use client";

import * as React from "react";

import { cn } from "../lib/cn";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { Kbd } from "./kbd";

type ShortcutHelpItem = {
  id: string;
  label: React.ReactNode;
  shortcut: React.ReactNode;
  description?: React.ReactNode;
};

type ShortcutHelpGroup = {
  id: string;
  label: React.ReactNode;
  shortcuts: readonly ShortcutHelpItem[];
};

type ShortcutListProps = React.ComponentProps<"div"> & {
  groups: readonly ShortcutHelpGroup[];
};

type ShortcutHelpDialogProps = Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  groups: readonly ShortcutHelpGroup[];
  title?: React.ReactNode;
  description?: React.ReactNode;
};

function ShortcutList({ groups, className, ...props }: ShortcutListProps) {
  return (
    <div data-slot="shortcut-list" className={cn("grid gap-4", className)} {...props}>
      {groups.map((group) => (
        <section key={group.id} data-slot="shortcut-list-group" className="grid gap-2">
          <h3 className="text-sm font-medium">{group.label}</h3>
          <div className="grid divide-y rounded-md border border-border/60">
            {group.shortcuts.map((shortcut) => (
              <div
                key={shortcut.id}
                data-slot="shortcut-list-item"
                className="grid gap-2 px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <span className="grid min-w-0 gap-0.5">
                  <span className="font-medium">{shortcut.label}</span>
                  {shortcut.description ? (
                    <span className="text-xs text-muted-foreground">{shortcut.description}</span>
                  ) : null}
                </span>
                <ShortcutKeys value={shortcut.shortcut} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ShortcutHelpDialog({
  groups,
  title = "Keyboard shortcuts",
  description = "Available keyboard commands for this surface.",
  ...props
}: ShortcutHelpDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ShortcutList groups={groups} />
      </DialogContent>
    </Dialog>
  );
}

function ShortcutKeys({ value }: { value: React.ReactNode }) {
  if (typeof value !== "string") {
    return <span data-slot="shortcut-keys">{value}</span>;
  }

  return (
    <span data-slot="shortcut-keys" className="flex flex-wrap items-center gap-1 sm:justify-end">
      {value.split("+").map((key) => (
        <Kbd key={key.trim()}>{key.trim()}</Kbd>
      ))}
    </span>
  );
}

export {
  ShortcutHelpDialog,
  ShortcutList,
  type ShortcutHelpDialogProps,
  type ShortcutHelpGroup,
  type ShortcutHelpItem,
  type ShortcutListProps,
};
