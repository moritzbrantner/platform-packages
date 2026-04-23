"use client";

import * as React from "react";

import { cn } from "../lib/cn";

type ChatBoxProps = React.ComponentProps<"section"> & {
  variant?: "default" | "compact";
};

type ChatBoxMessageProps = React.ComponentProps<"article"> & {
  align?: "start" | "end" | "center";
};

function ChatBox({ className, variant = "default", ...props }: ChatBoxProps) {
  return (
    <section
      data-slot="chat-box"
      data-variant={variant}
      className={cn(
        "group/chat-box flex min-h-0 w-full flex-col overflow-hidden rounded-lg border border-border/70 bg-card text-card-foreground shadow-xs data-[variant=compact]:rounded-md",
        className,
      )}
      {...props}
    />
  );
}

function ChatBoxHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-box-header"
      className={cn(
        "grid gap-1 border-b border-border/60 bg-muted/30 px-4 py-3 has-data-[slot=chat-box-actions]:grid-cols-[minmax(0,1fr)_auto]",
        className,
      )}
      {...props}
    />
  );
}

function ChatBoxTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="chat-box-title"
      className={cn("truncate text-base font-medium leading-snug text-foreground", className)}
      {...props}
    />
  );
}

function ChatBoxDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="chat-box-description"
      className={cn("truncate text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function ChatBoxActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-box-actions"
      className={cn("col-start-2 row-span-2 row-start-1 flex items-center gap-2", className)}
      {...props}
    />
  );
}

function ChatBoxBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="log"
      aria-live="polite"
      data-slot="chat-box-body"
      className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4", className)}
      {...props}
    />
  );
}

function ChatBoxMessage({ align = "start", className, ...props }: ChatBoxMessageProps) {
  return (
    <article
      data-slot="chat-box-message"
      data-align={align}
      className={cn(
        "group/chat-box-message flex w-full flex-col gap-1 data-[align=center]:items-center data-[align=end]:items-end",
        className,
      )}
      {...props}
    />
  );
}

function ChatBoxBubble({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-box-bubble"
      className={cn(
        "max-w-[min(82%,38rem)] rounded-lg border border-border/60 bg-background px-3 py-2 text-sm leading-6 shadow-xs group-data-[variant=compact]/chat-box:text-xs group-data-[align=end]/chat-box-message:border-primary/30 group-data-[align=end]/chat-box-message:bg-primary group-data-[align=end]/chat-box-message:text-primary-foreground group-data-[align=center]/chat-box-message:bg-muted/55 group-data-[align=center]/chat-box-message:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ChatBoxMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-box-meta"
      className={cn("px-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function ChatBoxFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-box-footer"
      className={cn("border-t border-border/60 bg-background/70 p-3", className)}
      {...props}
    />
  );
}

export {
  ChatBox,
  ChatBoxActions,
  ChatBoxBody,
  ChatBoxBubble,
  ChatBoxDescription,
  ChatBoxFooter,
  ChatBoxHeader,
  ChatBoxMessage,
  ChatBoxMeta,
  ChatBoxTitle,
  type ChatBoxMessageProps,
  type ChatBoxProps,
};
