"use client";

import * as React from "react";

import { cn } from "../lib/cn";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "./command";
import { LoadingState } from "./state-view";

type CommandPaletteAction = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  shortcut?: React.ReactNode;
  keywords?: string[];
  disabled?: boolean;
  checked?: boolean;
  destructive?: boolean;
  onSelect?: () => void;
};

type CommandPaletteGroup = {
  id: string;
  label?: React.ReactNode;
  actions: readonly CommandPaletteAction[];
};

type CommandPaletteProps = Omit<React.ComponentProps<typeof CommandDialog>, "children"> & {
  groups: readonly CommandPaletteGroup[];
  placeholder?: string;
  emptyMessage?: React.ReactNode;
  loading?: boolean;
  loadingMessage?: React.ReactNode;
  footer?: React.ReactNode;
};

function CommandPalette({
  groups,
  placeholder = "Search commands...",
  emptyMessage = "No commands found.",
  loading = false,
  loadingMessage = "Loading commands",
  footer,
  onOpenChange,
  className,
  ...props
}: CommandPaletteProps) {
  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  return (
    <CommandDialog
      className={cn("max-w-lg overflow-hidden p-0", className)}
      onOpenChange={handleOpenChange}
      {...props}
    >
      <Command>
        <CommandInput placeholder={placeholder} />
        <CommandList>
          {loading ? (
            <CommandItem value="loading" disabled>
              <LoadingState
                size="sm"
                label={loadingMessage}
                className="min-h-28 border-0 bg-transparent p-3"
              />
            </CommandItem>
          ) : (
            <>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            {groups.map((group, groupIndex) => (
              <React.Fragment key={group.id}>
                <CommandGroup heading={group.label} className={cn(groupIndex > 0 && "border-t")}>
                  {group.actions.map((action) => (
                    <CommandPaletteItem
                      key={action.id}
                      action={action}
                      onSelected={() => handleOpenChange(false)}
                    />
                  ))}
                </CommandGroup>
              </React.Fragment>
            ))}
            </>
          )}
        </CommandList>
        {footer ? (
          <div data-slot="command-palette-footer" className="border-t px-3 py-2 text-xs text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </Command>
    </CommandDialog>
  );
}

function CommandPaletteItem({
  action,
  onSelected,
}: {
  action: CommandPaletteAction;
  onSelected: () => void;
}) {
  return (
    <CommandItem
      value={[
        action.id,
        textFromNode(action.label),
        textFromNode(action.description),
        ...(action.keywords ?? []),
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={action.disabled}
      data-checked={action.checked ? true : undefined}
      data-destructive={action.destructive ? true : undefined}
      className={cn(
        action.destructive &&
          "text-destructive data-selected:bg-destructive/10 data-selected:text-destructive",
      )}
      onSelect={() => {
        if (action.disabled) {
          return;
        }

        action.onSelect?.();
        onSelected();
      }}
    >
      {action.icon ? <span data-slot="command-palette-action-icon">{action.icon}</span> : null}
      <span data-slot="command-palette-action-content" className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate">{action.label}</span>
        {action.description ? (
          <span className="truncate text-xs text-muted-foreground">{action.description}</span>
        ) : null}
      </span>
      {action.shortcut ? <CommandShortcut alwaysShowShortcut>{action.shortcut}</CommandShortcut> : null}
    </CommandItem>
  );
}

function textFromNode(node: React.ReactNode) {
  return typeof node === "string" || typeof node === "number" ? String(node) : "";
}

export {
  CommandPalette,
  type CommandPaletteAction,
  type CommandPaletteGroup,
  type CommandPaletteProps,
};
