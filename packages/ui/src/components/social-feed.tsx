"use client";

import * as React from "react";

import { cn } from "../lib/cn";
import { Avatar, type AvatarProps } from "./avatar";
import { Textarea } from "./textarea";

type SocialPostProps = React.ComponentProps<"article"> & {
  featured?: boolean;
};

type SocialCommentProps = React.ComponentProps<"article"> & {
  align?: "start" | "end";
};

function SocialPost({ className, featured = false, ...props }: SocialPostProps) {
  return (
    <article
      data-slot="social-post"
      data-featured={featured ? true : undefined}
      className={cn(
        "grid gap-4 rounded-xl border border-border/70 bg-card p-4 text-card-foreground shadow-xs data-[featured=true]:border-primary/20 data-[featured=true]:bg-linear-to-br data-[featured=true]:from-card data-[featured=true]:to-primary/5",
        className,
      )}
      {...props}
    />
  );
}

function SocialPostHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="social-post-header"
      className={cn(
        "grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:gap-4 has-[>[data-slot=social-post-author-actions]]:sm:grid-cols-[auto_minmax(0,1fr)_auto]",
        className,
      )}
      {...props}
    />
  );
}

function SocialPostAvatar({ className, size = "lg", ...props }: AvatarProps) {
  return (
    <Avatar
      data-slot="social-post-avatar"
      size={size}
      className={cn("size-11", className)}
      {...props}
    />
  );
}

function SocialPostAuthor({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="social-post-author"
      className={cn("grid min-w-0 gap-1", className)}
      {...props}
    />
  );
}

function SocialPostTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="social-post-title"
      className={cn("truncate text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}

function SocialPostMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="social-post-meta"
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function SocialPostAuthorActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="social-post-author-actions"
      className={cn("flex items-center justify-start gap-2 sm:justify-end", className)}
      {...props}
    />
  );
}

function SocialPostBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="social-post-body" className={cn("grid gap-3", className)} {...props} />;
}

function SocialPostText({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="social-post-text"
      className={cn("whitespace-pre-wrap text-sm leading-6 text-foreground/90", className)}
      {...props}
    />
  );
}

function SocialPostMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="social-post-media"
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-muted/30 [&>img]:aspect-video [&>img]:w-full [&>img]:object-cover",
        className,
      )}
      {...props}
    />
  );
}

function SocialPostFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="social-post-footer"
      className={cn("grid gap-3 border-t border-border/60 pt-3", className)}
      {...props}
    />
  );
}

function SocialPostMetrics({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="social-post-metrics"
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function SocialCommentList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="social-comment-list"
      role="list"
      className={cn("grid gap-3 rounded-xl bg-muted/35 p-3", className)}
      {...props}
    />
  );
}

function SocialComment({ className, align = "start", ...props }: SocialCommentProps) {
  return (
    <article
      data-slot="social-comment"
      data-align={align}
      role="listitem"
      className={cn(
        "group/social-comment flex items-start gap-3 data-[align=end]:flex-row-reverse data-[align=end]:text-right",
        className,
      )}
      {...props}
    />
  );
}

function SocialCommentAvatar({ className, size = "default", ...props }: AvatarProps) {
  return (
    <Avatar
      data-slot="social-comment-avatar"
      size={size}
      className={cn("size-9", className)}
      {...props}
    />
  );
}

function SocialCommentContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="social-comment-content"
      className={cn(
        "grid min-w-0 flex-1 gap-1 rounded-xl bg-background px-3 py-2 ring-1 ring-border/60 group-data-[align=end]/social-comment:items-end",
        className,
      )}
      {...props}
    />
  );
}

function SocialCommentMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="social-comment-meta"
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground group-data-[align=end]/social-comment:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function SocialCommentText({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="social-comment-text"
      className={cn("whitespace-pre-wrap text-sm leading-6 text-foreground/90", className)}
      {...props}
    />
  );
}

function SocialCommentActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="social-comment-actions"
      className={cn(
        "flex flex-wrap items-center gap-3 text-xs text-muted-foreground group-data-[align=end]/social-comment:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function SocialComposer({ className, ...props }: React.ComponentProps<"form">) {
  return (
    <form
      data-slot="social-composer"
      className={cn(
        "overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

function SocialComposerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="social-composer-header"
      className={cn("flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3", className)}
      {...props}
    />
  );
}

function SocialComposerTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="social-composer-textarea"
      className={cn(
        "min-h-28 resize-y rounded-none border-0 px-4 py-3 shadow-none ring-0 focus-visible:ring-0",
        className,
      )}
      {...props}
    />
  );
}

function SocialComposerToolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="social-composer-toolbar"
      className={cn(
        "grid gap-3 border-t border-border/60 bg-muted/20 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
        className,
      )}
      {...props}
    />
  );
}

function SocialComposerActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="social-composer-actions"
      className={cn("flex flex-wrap items-center justify-start gap-2 sm:justify-end", className)}
      {...props}
    />
  );
}

export {
  SocialComment,
  SocialCommentActions,
  SocialCommentAvatar,
  SocialCommentContent,
  SocialCommentList,
  SocialCommentMeta,
  SocialCommentText,
  SocialComposer,
  SocialComposerActions,
  SocialComposerHeader,
  SocialComposerTextarea,
  SocialComposerToolbar,
  SocialPost,
  SocialPostAuthor,
  SocialPostAuthorActions,
  SocialPostAvatar,
  SocialPostBody,
  SocialPostFooter,
  SocialPostHeader,
  SocialPostMedia,
  SocialPostMeta,
  SocialPostMetrics,
  SocialPostText,
  SocialPostTitle,
  type SocialCommentProps,
  type SocialPostProps,
};
