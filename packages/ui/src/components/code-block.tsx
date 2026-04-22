import * as React from "react";

import { cn } from "../lib/cn";

function CodeBlock({ className, ...props }: React.ComponentProps<"figure">) {
  return (
    <figure
      data-slot="code-block"
      className={cn(
        "group/code-block overflow-hidden border bg-card text-card-foreground text-sm shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function CodeBlockHeader({ className, ...props }: React.ComponentProps<"figcaption">) {
  return (
    <figcaption
      data-slot="code-block-header"
      className={cn(
        "flex min-h-10 items-center justify-between gap-3 border-b bg-muted/35 px-3 py-2",
        className,
      )}
      {...props}
    />
  );
}

function CodeBlockTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="code-block-title"
      className={cn("min-w-0 truncate font-mono text-xs font-medium", className)}
      {...props}
    />
  );
}

function CodeBlockActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="code-block-actions"
      className={cn("flex shrink-0 items-center gap-1.5", className)}
      {...props}
    />
  );
}

function CodeBlockContent({ className, ...props }: React.ComponentProps<"pre">) {
  return (
    <pre
      data-slot="code-block-content"
      className={cn("max-h-96 overflow-auto p-3 font-mono text-xs leading-6", className)}
      {...props}
    />
  );
}

function CodeBlockCode({ className, ...props }: React.ComponentProps<"code">) {
  return <code data-slot="code-block-code" className={cn("font-mono", className)} {...props} />;
}

export {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCode,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockTitle,
};
