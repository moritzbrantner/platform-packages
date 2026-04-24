"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";

import { cn } from "../lib/cn";

type AvatarSize = "xs" | "sm" | "default" | "lg" | "xl";
type AvatarShape = "round" | "square" | "hexagonal" | "octagonal";

type AvatarRootProps = React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: AvatarSize;
  shape?: AvatarShape;
};

type AvatarProps = Omit<AvatarRootProps, "children"> & {
  name?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
  initials?: string;
  maxInitials?: number;
  online?: boolean;
  fallback?: React.ReactNode;
};

function AvatarRoot({
  className,
  size = "default",
  shape = "round",
  ...props
}: AvatarRootProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      data-shape={shape}
      className={cn(
        "group/avatar relative flex size-8 shrink-0 select-none after:absolute after:inset-0 after:border after:border-border after:content-[''] after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 data-[size=xl]:size-12 data-[size=xs]:size-5 data-[shape=round]:after:rounded-full data-[shape=square]:after:rounded-md data-[shape=hexagonal]:after:[clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)] data-[shape=octagonal]:after:[clip-path:polygon(30%_0,70%_0,100%_30%,100%_70%,70%_100%,30%_100%,0_70%,0_30%)] dark:after:mix-blend-lighten",
        className,
      )}
      {...props}
    />
  );
}

function Avatar({
  className,
  size = "default",
  shape = "round",
  name,
  imageUrl,
  imageAlt = "",
  initials,
  maxInitials = 2,
  online = false,
  fallback,
  ...props
}: AvatarProps) {
  return (
    <AvatarRoot className={className} size={size} shape={shape} {...props}>
      {imageUrl ? <AvatarImage src={imageUrl} alt={imageAlt} /> : null}
      <AvatarFallback name={name} initials={initials} maxInitials={maxInitials}>
        {fallback}
      </AvatarFallback>
      {online ? <AvatarBadge /> : null}
    </AvatarRoot>
  );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full object-cover group-data-[shape=round]/avatar:rounded-full group-data-[shape=square]/avatar:rounded-md group-data-[shape=hexagonal]/avatar:[clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)] group-data-[shape=octagonal]/avatar:[clip-path:polygon(30%_0,70%_0,100%_30%,100%_70%,70%_100%,30%_100%,0_70%,0_30%)]",
        className,
      )}
      {...props}
    />
  );
}

type AvatarFallbackProps = React.ComponentProps<typeof AvatarPrimitive.Fallback> & {
  name?: string | null;
  initials?: string;
  maxInitials?: number;
};

function AvatarFallback({
  className,
  children,
  initials,
  name,
  maxInitials = 2,
  ...props
}: AvatarFallbackProps) {
  const fallback = children ?? initials ?? getAvatarInitials(name, { maxInitials });

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center bg-muted text-sm font-medium text-muted-foreground group-data-[size=lg]/avatar:text-base group-data-[size=sm]/avatar:text-xs group-data-[size=xl]/avatar:text-base group-data-[size=xs]/avatar:text-[10px] group-data-[shape=round]/avatar:rounded-full group-data-[shape=square]/avatar:rounded-md group-data-[shape=hexagonal]/avatar:[clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)] group-data-[shape=octagonal]/avatar:[clip-path:polygon(30%_0,70%_0,100%_30%,100%_70%,70%_100%,30%_100%,0_70%,0_30%)]",
        className,
      )}
      {...props}
    >
      {fallback}
    </AvatarPrimitive.Fallback>
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
        "group-data-[size=xs]/avatar:size-1.5 group-data-[size=xs]/avatar:[&>svg]:hidden",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        "group-data-[size=xl]/avatar:size-3.5 group-data-[size=xl]/avatar:[&>svg]:size-2.5",
        className,
      )}
      {...props}
    />
  );
}

function getAvatarInitials(
  name: string | null | undefined,
  {
    fallback = "?",
    maxInitials = 2,
  }: {
    fallback?: string;
    maxInitials?: number;
  } = {},
) {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0 || maxInitials < 1) {
    return fallback;
  }

  return words
    .slice(0, maxInitials)
    .map((word) => word.at(0)?.toLocaleUpperCase())
    .join("");
}

export {
  Avatar,
  AvatarRoot,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  getAvatarInitials,
  type AvatarProps,
  type AvatarSize,
  type AvatarShape,
};
