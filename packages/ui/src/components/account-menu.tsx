"use client";

import * as React from "react";

import { cn } from "../lib/cn";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
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
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
};

function AccountMenu({
  user,
  label = "Open account menu",
  guestLabel = "Guest",
  items = [],
  align = "end",
  sideOffset = 8,
  className,
}: AccountMenuProps): React.ReactElement {
  const fallbackName = getAccountMenuText(user?.name) ?? getAccountMenuText(guestLabel) ?? label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-full outline-none transition-[box-shadow,transform,background-color] hover:-translate-y-[1px] hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            className,
          )}
        >
          <Avatar>
            {user?.imageUrl ? <AvatarImage src={user.imageUrl} alt="" /> : null}
            <AvatarFallback name={fallbackName} initials={user?.initials} />
          </Avatar>
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
