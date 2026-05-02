"use client";

import * as React from "react";
import { BellIcon, CheckCheckIcon, CheckIcon } from "lucide-react";

import { cn } from "../lib/cn";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export type NotificationMenuItem = {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  unread?: boolean;
  icon?: React.ReactNode;
  meta?: React.ReactNode;
  disabled?: boolean;
  onSelect?: () => void;
  onMarkRead?: (itemId: string, item: NotificationMenuItem) => void;
};

export type NotificationMenuProps = {
  label?: string;
  titleHref?: string;
  titleLinkProps?: Omit<React.ComponentPropsWithoutRef<"a">, "children" | "href">;
  unreadCount?: number;
  maxCount?: number;
  items?: NotificationMenuItem[];
  emptyLabel?: React.ReactNode;
  markAllReadLabel?: React.ReactNode;
  markReadLabel?: React.ReactNode;
  onMarkAllRead?: () => void;
  onMarkRead?: (itemId: string, item: NotificationMenuItem) => void;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  maxItems?: number;
  className?: string;
};

function NotificationMenu({
  label = "Notifications",
  titleHref,
  titleLinkProps,
  unreadCount = 0,
  maxCount = 99,
  items = [],
  emptyLabel = "No notifications",
  markAllReadLabel = "Mark all read",
  markReadLabel = "Mark read",
  onMarkAllRead,
  onMarkRead,
  align = "end",
  sideOffset = 8,
  maxItems,
  className,
}: NotificationMenuProps): React.ReactElement {
  const visibleItems = typeof maxItems === "number" ? items.slice(0, maxItems) : items;
  const countLabel = formatNotificationMenuCount(unreadCount, maxCount);
  const accessibleLabel = unreadCount > 0 ? `${label}, ${unreadCount} unread` : label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={accessibleLabel}
          title={accessibleLabel}
          className={cn("relative", className)}
        >
          <BellIcon />
          {unreadCount > 0 ? (
            <Badge asChild className="absolute -right-2 -top-2 min-w-5 justify-center px-1">
              <span aria-hidden="true">{countLabel}</span>
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={sideOffset} className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-3 px-2 py-2">
          {titleHref ? (
            <a
              {...titleLinkProps}
              href={titleHref}
              className={cn(
                "min-w-0 truncate rounded-sm text-sm font-medium text-popover-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50",
                titleLinkProps?.className,
              )}
            >
              {label}
            </a>
          ) : (
            <span className="truncate text-sm font-medium text-popover-foreground">{label}</span>
          )}
          {unreadCount > 0 ? <span className="shrink-0 text-xs">{unreadCount} unread</span> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {visibleItems.length === 0 ? (
          <DropdownMenuLabel className="px-2 py-3 text-sm">{emptyLabel}</DropdownMenuLabel>
        ) : (
          visibleItems.map((item) => {
            const itemMarkRead = item.onMarkRead ?? onMarkRead;
            const canMarkRead = Boolean(item.unread && !item.disabled && itemMarkRead);
            const itemTitle = getNotificationMenuText(item.title);
            const markReadActionLabel = itemTitle
              ? `Mark ${itemTitle} as read`
              : getNotificationMenuText(markReadLabel) ?? "Mark notification as read";

            return (
              <DropdownMenuItem
                key={item.id}
                disabled={item.disabled}
                onSelect={item.onSelect}
                className="items-start gap-2 py-2 pr-1"
              >
                {item.icon ? <span className="mt-0.5 shrink-0">{item.icon}</span> : null}
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 truncate font-medium">{item.title}</span>
                    {item.unread ? (
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full bg-primary"
                      />
                    ) : null}
                  </span>
                  {item.description ? (
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </span>
                {item.meta || canMarkRead ? (
                  <span className="mt-0.5 flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    {item.meta ? <span>{item.meta}</span> : null}
                    {canMarkRead ? (
                      <button
                        type="button"
                        aria-label={markReadActionLabel}
                        title={markReadActionLabel}
                        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();

                          if (item.onMarkRead) {
                            item.onMarkRead(item.id, item);
                            return;
                          }

                          onMarkRead?.(item.id, item);
                        }}
                      >
                        <CheckIcon className="size-3.5" />
                        <span className="sr-only">{markReadLabel}</span>
                      </button>
                    ) : null}
                  </span>
                ) : null}
              </DropdownMenuItem>
            );
          })
        )}
        {onMarkAllRead ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={unreadCount === 0} onSelect={onMarkAllRead}>
              <CheckCheckIcon />
              {markAllReadLabel}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatNotificationMenuCount(count: number, maxCount: number): string {
  const safeCount = Math.max(0, Math.trunc(count));
  const safeMax = Math.max(1, Math.trunc(maxCount));

  return safeCount > safeMax ? `${safeMax}+` : String(safeCount);
}

function getNotificationMenuText(value: React.ReactNode): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export { NotificationMenu };
