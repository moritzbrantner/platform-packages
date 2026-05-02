"use client";

import * as React from "react";

import { cn } from "../lib/cn";
import { Avatar, type AvatarProps, type AvatarShape } from "./avatar";
import { avatarShapeStyles } from "./avatar-shapes";

type AvatarCollectionItem = AvatarProps & {
  key?: React.Key;
};

type AvatarCollectionProps = Omit<React.ComponentProps<"div">, "children"> & {
  users: AvatarCollectionItem[];
  maxVisible?: number;
  overflowLabel?: React.ReactNode;
  overflowShape?: AvatarShape;
};

function AvatarCollection({
  className,
  users,
  maxVisible,
  overflowLabel,
  overflowShape = "round",
  ...props
}: AvatarCollectionProps) {
  const visibleUsers = users.slice(0, maxVisible ?? users.length);
  const hiddenCount =
    maxVisible !== undefined ? Math.max(0, users.length - visibleUsers.length) : 0;

  return (
    <div
      data-slot="avatar-collection"
      className={cn(
        "group/avatar-collection flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background *:data-[shape=hexagonal]:ring-0 *:data-[shape=octagonal]:ring-0",
        className,
      )}
      {...props}
    >
      {visibleUsers.map(({ key, ...user }, index) => (
        <Avatar
          key={key ?? user.name ?? user.initials ?? user.imageUrl ?? `avatar-${index}`}
          {...user}
        />
      ))}
      {hiddenCount > 0 ? (
        <AvatarCollectionCount shape={overflowShape}>
          {overflowLabel ?? `+${hiddenCount}`}
        </AvatarCollectionCount>
      ) : null}
    </div>
  );
}

function AvatarCollectionCount({
  className,
  shape = "round",
  style,
  ...props
}: React.ComponentProps<"div"> & {
  shape?: AvatarShape;
}) {
  return (
    <div
      data-slot="avatar-collection-count"
      data-shape={shape}
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center overflow-hidden border border-border bg-muted text-sm font-medium text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-collection:size-10 group-has-data-[size=sm]/avatar-collection:size-6 group-has-data-[size=xl]/avatar-collection:size-12 group-has-data-[size=xs]/avatar-collection:size-5 group-has-data-[size=sm]/avatar-collection:text-xs group-has-data-[size=xl]/avatar-collection:text-base group-has-data-[size=xs]/avatar-collection:text-[10px] data-[shape=hexagonal]:ring-0 data-[shape=octagonal]:ring-0 [&>svg]:size-4 group-has-data-[size=lg]/avatar-collection:[&>svg]:size-5 group-has-data-[size=sm]/avatar-collection:[&>svg]:size-3 group-has-data-[size=xl]/avatar-collection:[&>svg]:size-5 group-has-data-[size=xs]/avatar-collection:[&>svg]:size-2.5",
        className,
      )}
      style={{ ...avatarShapeStyles[shape], ...style }}
      {...props}
    />
  );
}

function AvatarGroup(props: React.ComponentProps<typeof AvatarCollection>) {
  return <AvatarCollection {...props} />;
}

function AvatarGroupCount(props: React.ComponentProps<typeof AvatarCollectionCount>) {
  return <AvatarCollectionCount {...props} />;
}

export {
  AvatarCollection,
  AvatarCollectionCount,
  AvatarGroup,
  AvatarGroupCount,
  type AvatarCollectionItem,
  type AvatarCollectionProps,
};
