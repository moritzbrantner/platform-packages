"use client";

import * as React from "react";
import { CheckIcon, ClipboardIcon } from "lucide-react";

import { cn } from "../lib/cn";
import { Button } from "./button";

type CopyButtonProps = Omit<React.ComponentProps<typeof Button>, "children" | "onClick"> & {
  value: string;
  idleLabel?: React.ReactNode;
  copiedLabel?: React.ReactNode;
  timeout?: number;
  copy?: (value: string) => Promise<void> | void;
  onCopied?: (value: string) => void;
  onCopyError?: (error: unknown) => void;
};

async function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard API is unavailable.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const copied = document.execCommand("copy");

    if (!copied) {
      throw new Error("Copy command was rejected.");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

function CopyButton({
  value,
  idleLabel = "Copy",
  copiedLabel = "Copied",
  timeout = 1600,
  copy = copyText,
  onCopied,
  onCopyError,
  className,
  variant = "outline",
  size = "sm",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleClick() {
    try {
      await copy(value);
      setCopied(true);
      onCopied?.(value);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => setCopied(false), timeout);
    } catch (error) {
      onCopyError?.(error);
    }
  }

  const Icon = copied ? CheckIcon : ClipboardIcon;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("min-w-20", className)}
      aria-live="polite"
      onClick={handleClick}
      {...props}
    >
      <Icon />
      {copied ? copiedLabel : idleLabel}
    </Button>
  );
}

export { CopyButton, copyText };
