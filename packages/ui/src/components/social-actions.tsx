"use client";

import * as React from "react";
import {
  HeartIcon,
  MessageCircleIcon,
  Share2Icon,
  UserCheckIcon,
  UserPlusIcon,
} from "lucide-react";

import { cn } from "../lib/cn";
import { Button } from "./button";

type SocialActionButtonProps = Omit<React.ComponentProps<typeof Button>, "aria-pressed"> & {
  count?: number | string;
  label?: string;
  showCount?: boolean;
};

type LikeButtonProps = SocialActionButtonProps & {
  liked?: boolean;
};

type FollowButtonProps = SocialActionButtonProps & {
  following?: boolean;
};

type ShareButtonProps = SocialActionButtonProps & {
  shared?: boolean;
};

type CommentButtonProps = SocialActionButtonProps & {
  commented?: boolean;
};

function SocialActionGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="social-action-group"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

function LikeButton({
  liked = false,
  count,
  label,
  showCount = true,
  variant,
  children,
  className,
  ...props
}: LikeButtonProps) {
  const buttonLabel = label ?? (liked ? "Unlike" : "Like");

  return (
    <Button
      data-slot="like-button"
      aria-pressed={liked}
      data-liked={liked ? true : undefined}
      variant={variant ?? (liked ? "secondary" : "outline")}
      className={cn("min-w-0", className)}
      {...props}
    >
      <HeartIcon className={cn(liked && "fill-current")} />
      <span>{children ?? buttonLabel}</span>
      {showCount && count !== undefined ? (
        <span data-slot="social-action-count" className="tabular-nums text-current/75">
          {count}
        </span>
      ) : null}
    </Button>
  );
}

function ShareButton({
  shared = false,
  count,
  label = "Share",
  showCount = true,
  variant = "outline",
  children,
  className,
  ...props
}: ShareButtonProps) {
  return (
    <Button
      data-slot="share-button"
      aria-pressed={shared || undefined}
      data-shared={shared ? true : undefined}
      variant={variant}
      className={cn("min-w-0", className)}
      {...props}
    >
      <Share2Icon />
      <span>{children ?? label}</span>
      {showCount && count !== undefined ? (
        <span data-slot="social-action-count" className="tabular-nums text-current/75">
          {count}
        </span>
      ) : null}
    </Button>
  );
}

function CommentButton({
  commented = false,
  count,
  label = "Comment",
  showCount = true,
  variant,
  children,
  className,
  ...props
}: CommentButtonProps) {
  return (
    <Button
      data-slot="comment-button"
      aria-pressed={commented}
      data-commented={commented ? true : undefined}
      variant={variant ?? (commented ? "secondary" : "outline")}
      className={cn("min-w-0", className)}
      {...props}
    >
      <MessageCircleIcon />
      <span>{children ?? label}</span>
      {showCount && count !== undefined ? (
        <span data-slot="social-action-count" className="tabular-nums text-current/75">
          {count}
        </span>
      ) : null}
    </Button>
  );
}

function FollowButton({
  following = false,
  count,
  label,
  showCount = true,
  variant,
  children,
  className,
  ...props
}: FollowButtonProps) {
  const buttonLabel = label ?? (following ? "Following" : "Follow");
  const Icon = following ? UserCheckIcon : UserPlusIcon;

  return (
    <Button
      data-slot="follow-button"
      aria-pressed={following}
      data-following={following ? true : undefined}
      variant={variant ?? (following ? "secondary" : "default")}
      className={cn("min-w-0", className)}
      {...props}
    >
      <Icon />
      <span>{children ?? buttonLabel}</span>
      {showCount && count !== undefined ? (
        <span data-slot="social-action-count" className="tabular-nums text-current/75">
          {count}
        </span>
      ) : null}
    </Button>
  );
}

export {
  CommentButton,
  FollowButton,
  LikeButton,
  ShareButton,
  SocialActionGroup,
  type CommentButtonProps,
  type FollowButtonProps,
  type LikeButtonProps,
  type ShareButtonProps,
  type SocialActionButtonProps,
};
