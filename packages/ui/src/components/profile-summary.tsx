"use client";

import * as React from "react";

import { cn } from "../lib/cn";
import { Avatar } from "./avatar";

type ProfileSummaryOrientation = "horizontal" | "vertical";

type ProfileSummaryProps = React.ComponentProps<"article"> & {
  orientation?: ProfileSummaryOrientation;
};

type ProfileSummaryAvatarProps = React.ComponentProps<typeof Avatar> & {
  imageUrl?: string | null;
  initials?: string;
  name?: string;
  online?: boolean;
  children?: React.ReactNode;
};

function ProfileSummary({ className, orientation = "horizontal", ...props }: ProfileSummaryProps) {
  return (
    <article
      data-slot="profile-summary"
      data-orientation={orientation}
      className={cn(
        "group/profile-summary flex gap-4 rounded-lg border border-border/70 bg-card p-4 text-card-foreground shadow-xs data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=horizontal]:items-start",
        className,
      )}
      {...props}
    />
  );
}

function ProfileSummaryAvatar({
  imageUrl,
  initials,
  name,
  online = false,
  children,
  className,
  size = "lg",
  ...props
}: ProfileSummaryAvatarProps) {
  return (
    <Avatar
      data-slot="profile-summary-avatar"
      size={size}
      className={cn("size-12", className)}
      imageUrl={imageUrl}
      initials={initials}
      name={name}
      online={online}
      fallback={children}
      {...props}
    />
  );
}

function ProfileSummaryContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="profile-summary-content"
      className={cn("grid min-w-0 flex-1 gap-3", className)}
      {...props}
    />
  );
}

function ProfileSummaryHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="profile-summary-header"
      className={cn(
        "grid min-w-0 gap-1 group-data-[orientation=horizontal]/profile-summary:sm:grid-cols-[minmax(0,1fr)_auto]",
        className,
      )}
      {...props}
    />
  );
}

function ProfileSummaryTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="profile-summary-title"
      className={cn("truncate text-base font-medium leading-snug text-foreground", className)}
      {...props}
    />
  );
}

function ProfileSummarySubtitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="profile-summary-subtitle"
      className={cn("text-sm leading-5 text-muted-foreground", className)}
      {...props}
    />
  );
}

function ProfileSummaryDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="profile-summary-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}

function ProfileSummaryMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="profile-summary-meta"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ProfileSummaryStats({ className, ...props }: React.ComponentProps<"dl">) {
  return (
    <dl
      data-slot="profile-summary-stats"
      className={cn("grid gap-3 sm:grid-cols-3", className)}
      {...props}
    />
  );
}

function ProfileSummaryStat({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="profile-summary-stat"
      className={cn("min-w-0 rounded-md border border-border/60 bg-muted/35 px-3 py-2", className)}
      {...props}
    />
  );
}

function ProfileSummaryStatLabel({ className, ...props }: React.ComponentProps<"dt">) {
  return (
    <dt
      data-slot="profile-summary-stat-label"
      className={cn("truncate text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function ProfileSummaryStatValue({ className, ...props }: React.ComponentProps<"dd">) {
  return (
    <dd
      data-slot="profile-summary-stat-value"
      className={cn("mt-1 truncate text-sm font-medium tabular-nums", className)}
      {...props}
    />
  );
}

function ProfileSummaryActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="profile-summary-actions"
      className={cn(
        "flex flex-wrap items-center gap-2 group-data-[orientation=horizontal]/profile-summary:sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export {
  ProfileSummary,
  ProfileSummaryActions,
  ProfileSummaryAvatar,
  ProfileSummaryContent,
  ProfileSummaryDescription,
  ProfileSummaryHeader,
  ProfileSummaryMeta,
  ProfileSummaryStat,
  ProfileSummaryStatLabel,
  ProfileSummaryStatValue,
  ProfileSummaryStats,
  ProfileSummarySubtitle,
  ProfileSummaryTitle,
  type ProfileSummaryAvatarProps,
  type ProfileSummaryOrientation,
  type ProfileSummaryProps,
};
