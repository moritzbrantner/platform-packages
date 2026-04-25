"use client";

import * as React from "react";

import { cn } from "../lib/cn";
import { Avatar } from "./avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export type AccountMenuUser = {
  name: React.ReactNode;
  email?: React.ReactNode;
  imageUrl?: string | null;
  initials?: string;
  meta?: React.ReactNode;
};

export type AccountMenuItem = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: () => void;
};

export type AccountMenuProps = {
  user: AccountMenuUser | null;
  label?: string;
  guestLabel?: React.ReactNode;
  items?: AccountMenuItem[];
  triggerVariant?: "icon" | "inline";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
};

function AccountMenu({
  user,
  label = "Open account menu",
  guestLabel = "Guest",
  items = [],
  triggerVariant = "icon",
  align = "end",
  sideOffset = 8,
  className,
}: AccountMenuProps): React.ReactElement {
  const fallbackName = getAccountMenuText(user?.name) ?? getAccountMenuText(guestLabel) ?? label;
  const secondaryText = user?.meta ?? user?.email;
  const inlineUser = triggerVariant === "inline" ? user : null;
  const iconTrigger = inlineUser === null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className={cn(
            inlineUser
              ? "inline-flex h-10 max-w-56 shrink-0 items-center gap-2 rounded-full border border-border/60 bg-background/45 px-2.5 pr-3 text-left shadow-[var(--glass-shadow)] outline-none transition-[box-shadow,transform,background-color,border-color] hover:-translate-y-[1px] hover:border-border hover:bg-accent/45 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              : "group/account-menu inline-flex shrink-0 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            className,
          )}
        >
          <Avatar
            className={
              iconTrigger
                ? "shadow-[var(--glass-shadow)] transition-[box-shadow,transform,filter] group-hover/account-menu:-translate-y-[1px] group-hover/account-menu:brightness-[1.03] group-data-[state=open]/account-menu:-translate-y-[1px]"
                : undefined
            }
            size={inlineUser ? "sm" : "default"}
            name={fallbackName}
            initials={user?.initials}
            imageUrl={user?.imageUrl}
          />
          {inlineUser ? (
            <span className="grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate text-sm font-medium text-foreground">{inlineUser.name}</span>
              {secondaryText ? (
                <span className="truncate text-xs text-muted-foreground">{secondaryText}</span>
              ) : null}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={sideOffset} className="w-72">
        <DropdownMenuLabel className="grid gap-0.5 px-2 py-2">
          <span className="truncate text-sm font-medium text-popover-foreground">
            {user?.name ?? guestLabel}
          </span>
          {user?.email ? <span className="truncate text-xs">{user.email}</span> : null}
          {user?.meta ? <span className="truncate text-xs">{user.meta}</span> : null}
        </DropdownMenuLabel>
        {items.length > 0 ? <DropdownMenuSeparator /> : null}
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            disabled={item.disabled}
            variant={item.destructive ? "destructive" : "default"}
            onSelect={item.onSelect}
          >
            {item.icon}
            <span className="min-w-0 truncate">{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getAccountMenuText(value: React.ReactNode): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export { AccountMenu };
