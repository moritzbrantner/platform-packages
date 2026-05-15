"use client";

import * as React from "react";
import {
  CircleCheckIcon,
  CircleSlashIcon,
  FileIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";

import { cn } from "../lib/cn";
import { Button } from "./button";
import { Progress } from "./progress";

type UploadQueueItemStatus = "queued" | "uploading" | "complete" | "error" | "canceled";

type UploadQueueFile = {
  id: string;
  name: React.ReactNode;
  description?: React.ReactNode;
  sizeLabel?: React.ReactNode;
  progress?: number;
  status: UploadQueueItemStatus;
  error?: React.ReactNode;
  preview?: React.ReactNode;
};

type UploadQueueProps = React.ComponentProps<"div"> & {
  items: readonly UploadQueueFile[];
  emptyState?: React.ReactNode;
  onRetry?: (item: UploadQueueFile) => void;
  onCancel?: (item: UploadQueueFile) => void;
  onRemove?: (item: UploadQueueFile) => void;
};

type UploadQueueItemProps = React.ComponentProps<"div"> & {
  item: UploadQueueFile;
  onRetry?: (item: UploadQueueFile) => void;
  onCancel?: (item: UploadQueueFile) => void;
  onRemove?: (item: UploadQueueFile) => void;
};

const uploadQueueStatusLabels: Record<UploadQueueItemStatus, string> = {
  queued: "Queued",
  uploading: "Uploading",
  complete: "Complete",
  error: "Error",
  canceled: "Canceled",
};

function UploadQueue({
  items,
  emptyState = "No uploads queued.",
  onRetry,
  onCancel,
  onRemove,
  className,
  ...props
}: UploadQueueProps) {
  return (
    <div data-slot="upload-queue" className={cn("grid gap-2", className)} {...props}>
      {items.length === 0 ? (
        <div
          data-slot="upload-queue-empty"
          className="rounded-md border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground"
        >
          {emptyState}
        </div>
      ) : (
        items.map((item) => (
          <UploadQueueItem
            key={item.id}
            item={item}
            onRetry={onRetry}
            onCancel={onCancel}
            onRemove={onRemove}
          />
        ))
      )}
    </div>
  );
}

function UploadQueueItem({
  item,
  onRetry,
  onCancel,
  onRemove,
  className,
  ...props
}: UploadQueueItemProps) {
  const StatusIcon = getUploadStatusIcon(item.status);

  return (
    <div
      data-slot="upload-queue-item"
      data-status={item.status}
      className={cn(
        "grid gap-3 rounded-md border border-border/60 bg-card/70 p-3 text-sm text-card-foreground sm:grid-cols-[auto_minmax(0,1fr)_auto]",
        className,
      )}
      {...props}
    >
      <div
        data-slot="upload-queue-preview"
        className="grid size-10 place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground"
      >
        {item.preview ?? <FileIcon aria-hidden="true" className="size-5" />}
      </div>
      <div data-slot="upload-queue-content" className="grid min-w-0 gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 truncate font-medium">{item.name}</span>
          {item.sizeLabel ? (
            <span className="text-xs text-muted-foreground">{item.sizeLabel}</span>
          ) : null}
        </div>
        {item.description ? (
          <p className="truncate text-xs text-muted-foreground">{item.description}</p>
        ) : null}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <StatusIcon aria-hidden="true" className="size-3.5" />
          <span>{uploadQueueStatusLabels[item.status]}</span>
        </div>
        {item.status === "uploading" ? (
          <Progress value={item.progress ?? 0} aria-label={`${textFromNode(item.name)} upload progress`} />
        ) : null}
        {item.error ? <p className="text-xs text-destructive">{item.error}</p> : null}
      </div>
      <div data-slot="upload-queue-actions" className="flex items-center justify-end gap-1">
        {item.status === "error" && onRetry ? (
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Retry upload" onClick={() => onRetry(item)}>
            <RotateCcwIcon />
          </Button>
        ) : null}
        {item.status === "uploading" && onCancel ? (
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Cancel upload" onClick={() => onCancel(item)}>
            <CircleSlashIcon />
          </Button>
        ) : null}
        {onRemove ? (
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove upload" onClick={() => onRemove(item)}>
            <XIcon />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function getUploadStatusIcon(status: UploadQueueItemStatus) {
  if (status === "uploading" || status === "queued") {
    return UploadCloudIcon;
  }

  if (status === "complete") {
    return CircleCheckIcon;
  }

  if (status === "error") {
    return TriangleAlertIcon;
  }

  return CircleSlashIcon;
}

function textFromNode(node: React.ReactNode) {
  return typeof node === "string" || typeof node === "number" ? String(node) : "File";
}

export {
  UploadQueue,
  UploadQueueItem,
  type UploadQueueFile,
  type UploadQueueItemProps,
  type UploadQueueItemStatus,
  type UploadQueueProps,
};
