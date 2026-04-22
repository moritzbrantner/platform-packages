"use client";

import * as React from "react";
import { SendIcon } from "lucide-react";

import { cn } from "../lib/cn";
import { Button } from "./button";
import { Textarea } from "./textarea";

function Chat({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="chat"
      className={cn(
        "flex min-h-0 w-full flex-col overflow-hidden rounded-md border border-border/60 bg-card/65 text-card-foreground shadow-xs supports-backdrop-filter:backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}

function ChatHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-header"
      className={cn(
        "grid gap-1 border-b border-border/60 bg-muted/30 px-4 py-3 has-data-[slot=chat-actions]:grid-cols-[minmax(0,1fr)_auto]",
        className,
      )}
      {...props}
    />
  );
}

function ChatTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="chat-title"
      className={cn("text-base font-medium leading-snug text-foreground", className)}
      {...props}
    />
  );
}

function ChatDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="chat-description"
      className={cn("text-sm leading-normal text-muted-foreground", className)}
      {...props}
    />
  );
}

function ChatActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-actions"
      className={cn("col-start-2 row-span-2 row-start-1 flex items-center gap-2", className)}
      {...props}
    />
  );
}

function ChatThread({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="log"
      aria-live="polite"
      data-slot="chat-thread"
      className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4", className)}
      {...props}
    />
  );
}

type ChatMessageProps = React.ComponentProps<"article"> & {
  align?: "start" | "end" | "center";
};

function ChatMessage({ align = "start", className, ...props }: ChatMessageProps) {
  return (
    <article
      data-slot="chat-message"
      data-align={align}
      className={cn(
        "group/chat-message flex w-full gap-2 data-[align=center]:justify-center data-[align=end]:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function ChatMessageAvatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-message-avatar"
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-medium text-muted-foreground group-data-[align=center]/chat-message:hidden group-data-[align=end]/chat-message:order-2",
        className,
      )}
      {...props}
    />
  );
}

function ChatMessageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-message-content"
      className={cn(
        "flex max-w-[min(78%,42rem)] flex-col gap-1 group-data-[align=center]/chat-message:items-center group-data-[align=end]/chat-message:items-end",
        className,
      )}
      {...props}
    />
  );
}

function ChatMessageMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-message-meta"
      className={cn("px-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function ChatBubble({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-bubble"
      className={cn(
        "rounded-lg border border-border/60 bg-background px-3 py-2 text-sm leading-6 shadow-xs group-data-[align=center]/chat-message:bg-muted/55 group-data-[align=center]/chat-message:text-muted-foreground group-data-[align=end]/chat-message:border-primary/30 group-data-[align=end]/chat-message:bg-primary group-data-[align=end]/chat-message:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ChatComposer({ className, ...props }: React.ComponentProps<"form">) {
  return (
    <form
      data-slot="chat-composer"
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 border-t border-border/60 bg-background/70 p-3",
        className,
      )}
      {...props}
    />
  );
}

function ChatComposerInput({ className, rows = 1, ...props }: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      data-slot="chat-composer-input"
      rows={rows}
      className={cn("max-h-32 min-h-9 resize-none rounded-md py-2", className)}
      {...props}
    />
  );
}

function ChatComposerActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-composer-actions"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

function ChatSendButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button data-slot="chat-send-button" size="icon-sm" type="submit" {...props}>
      {children ?? (
        <>
          <SendIcon />
          <span className="sr-only">Send message</span>
        </>
      )}
    </Button>
  );
}

export {
  Chat,
  ChatActions,
  ChatBubble,
  ChatComposer,
  ChatComposerActions,
  ChatComposerInput,
  ChatDescription,
  ChatHeader,
  ChatMessage,
  ChatMessageAvatar,
  ChatMessageContent,
  ChatMessageMeta,
  ChatSendButton,
  ChatThread,
  ChatTitle,
};
export type { ChatMessageProps };
