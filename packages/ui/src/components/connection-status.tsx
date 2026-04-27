"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { AlertTriangleIcon, CheckCheckIcon, RefreshCwIcon } from "lucide-react";

import { cn } from "../lib/cn";

export type ConnectionStatusState = "connected" | "disconnected" | "out-of-sync";

type ConnectionStatusProps = Omit<React.ComponentPropsWithoutRef<"button">, "children"> & {
  status: ConnectionStatusState;
  label?: React.ReactNode;
  detail?: React.ReactNode;
  pending?: boolean;
  onReconnect?: () => void | Promise<void>;
  onSync?: () => void | Promise<void>;
  syncLabel?: React.ReactNode;
  reconnectLabel?: React.ReactNode;
  syncingLabel?: React.ReactNode;
  reconnectingLabel?: React.ReactNode;
};

const connectionStatusVariants = cva(
  "group/connection-status inline-flex max-w-full items-center gap-3 rounded-xl border px-3 py-2 text-left shadow-xs outline-none transition-[border-color,background-color,color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      status: {
        connected: "border-emerald-500/25 bg-emerald-500/8 text-foreground hover:bg-emerald-500/12",
        disconnected:
          "border-destructive/25 bg-destructive/8 text-foreground hover:bg-destructive/12",
        "out-of-sync": "border-amber-500/30 bg-amber-500/10 text-foreground hover:bg-amber-500/14",
      },
    },
  },
);

const iconToneVariants = cva("flex size-8 shrink-0 items-center justify-center rounded-full", {
  variants: {
    status: {
      connected: "bg-emerald-500/14 text-emerald-700 dark:text-emerald-300",
      disconnected: "bg-destructive/14 text-destructive",
      "out-of-sync": "bg-amber-500/14 text-amber-700 dark:text-amber-300",
    },
  },
});

const actionToneVariants = cva("shrink-0 text-xs font-medium", {
  variants: {
    status: {
      connected: "text-emerald-700 dark:text-emerald-300",
      disconnected: "text-red-700 dark:text-red-300",
      "out-of-sync": "text-amber-700 dark:text-amber-300",
    },
  },
});

const statusConfig = {
  connected: {
    label: "Connected",
    detail: "All changes are up to date.",
    actionLabel: "Sync now",
    pendingLabel: "Syncing...",
    Icon: CheckCheckIcon,
  },
  disconnected: {
    label: "Disconnected",
    detail: "Connection lost.",
    actionLabel: "Reconnect",
    pendingLabel: "Reconnecting...",
    Icon: AlertTriangleIcon,
  },
  "out-of-sync": {
    label: "Out of sync",
    detail: "Pending changes need to sync.",
    actionLabel: "Sync up",
    pendingLabel: "Syncing...",
    Icon: RefreshCwIcon,
  },
} satisfies Record<
  ConnectionStatusState,
  {
    label: string;
    detail: string;
    actionLabel: string;
    pendingLabel: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
>;

function ConnectionStatus({
  status,
  label,
  detail,
  pending = false,
  disabled = false,
  type = "button",
  className,
  onClick,
  onReconnect,
  onSync,
  syncLabel,
  reconnectLabel,
  syncingLabel,
  reconnectingLabel,
  ...props
}: ConnectionStatusProps) {
  const [isPending, setIsPending] = React.useState(false);
  const config = statusConfig[status];
  const Icon = config.Icon;
  const action = status === "disconnected" ? onReconnect : onSync;
  const busy = pending || isPending;
  const isDisabled = disabled || (!action && !onClick);
  const resolvedLabel = label ?? config.label;
  const resolvedDetail = detail ?? config.detail;
  const idleActionLabel =
    status === "disconnected" ? reconnectLabel ?? config.actionLabel : syncLabel ?? config.actionLabel;
  const pendingActionLabel =
    status === "disconnected"
      ? reconnectingLabel ?? config.pendingLabel
      : syncingLabel ?? config.pendingLabel;
  const actionLabel = busy ? pendingActionLabel : idleActionLabel;

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event);

    if (event.defaultPrevented || isDisabled || !action || busy) {
      return;
    }

    try {
      setIsPending(true);
      await Promise.resolve(action());
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      data-slot="connection-status"
      data-status={status}
      data-pending={busy ? "true" : "false"}
      type={type}
      disabled={isDisabled}
      className={cn(connectionStatusVariants({ status }), className)}
      onClick={handleClick}
      {...props}
    >
      <span data-slot="connection-status-icon" className={cn(iconToneVariants({ status }))}>
        {busy ? <RefreshCwIcon className="size-4 animate-spin" /> : <Icon className="size-4" />}
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span data-slot="connection-status-label" className="truncate text-sm font-medium">
          {resolvedLabel}
        </span>
        <span
          data-slot="connection-status-detail"
          className="truncate text-xs text-muted-foreground"
        >
          {resolvedDetail}
        </span>
      </span>
      <span data-slot="connection-status-action" className={cn(actionToneVariants({ status }))}>
        {actionLabel}
      </span>
    </button>
  );
}

export { ConnectionStatus };
export type { ConnectionStatusProps };
