"use client";

import * as React from "react";
import {
  CheckCircle2Icon,
  CornerDownRightIcon,
  GitBranchIcon,
  HelpCircleIcon,
  XCircleIcon,
} from "lucide-react";

import { cn } from "../lib/cn";

type LogicalArgumentStatus = "valid" | "invalid" | "sound" | "unsound" | "open";
type LogicalArgumentRelation = "supports" | "objects" | "rebuts" | "undercuts";

type LogicalArgumentStatement = {
  id?: string;
  label?: React.ReactNode;
  text: React.ReactNode;
  note?: React.ReactNode;
};

type LogicalArgumentData = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  premises: readonly LogicalArgumentStatement[];
  conclusion: LogicalArgumentStatement;
  inferenceRule?: React.ReactNode;
  status?: LogicalArgumentStatus;
  relation?: LogicalArgumentRelation;
  children?: readonly LogicalArgumentData[];
};

type LogicalArgumentProps = React.ComponentProps<"article"> & {
  argument?: LogicalArgumentData;
  depth?: number;
  showStatementLabels?: boolean;
};

type LogicalArgumentStatementProps = React.ComponentProps<"li"> & {
  label?: React.ReactNode;
  note?: React.ReactNode;
};

type LogicalArgumentConclusionProps = React.ComponentProps<"section"> & {
  label?: React.ReactNode;
  note?: React.ReactNode;
};

type LogicalArgumentStatusBadgeProps = React.ComponentProps<"span"> & {
  status: LogicalArgumentStatus;
};

type LogicalArgumentRelationBadgeProps = React.ComponentProps<"span"> & {
  relation: LogicalArgumentRelation;
};

const statusLabels: Record<LogicalArgumentStatus, string> = {
  invalid: "Invalid",
  open: "Open",
  sound: "Sound",
  unsound: "Unsound",
  valid: "Valid",
};

const relationLabels: Record<LogicalArgumentRelation, string> = {
  objects: "Objects",
  rebuts: "Rebuts",
  supports: "Supports",
  undercuts: "Undercuts",
};

const statusClassNames: Record<LogicalArgumentStatus, string> = {
  invalid:
    "border-destructive/35 bg-destructive/10 text-red-700 dark:bg-destructive/20 dark:text-red-300",
  open: "border-border bg-muted text-muted-foreground",
  sound: "border-primary/35 bg-primary/10 text-primary",
  unsound:
    "border-destructive/35 bg-destructive/10 text-red-700 dark:bg-destructive/20 dark:text-red-300",
  valid: "border-primary/35 bg-primary/10 text-primary",
};

const relationClassNames: Record<LogicalArgumentRelation, string> = {
  objects:
    "border-destructive/30 bg-destructive/5 text-red-700 dark:bg-destructive/15 dark:text-red-300",
  rebuts:
    "border-destructive/30 bg-destructive/5 text-red-700 dark:bg-destructive/15 dark:text-red-300",
  supports: "border-primary/30 bg-primary/5 text-primary",
  undercuts: "border-border bg-muted text-muted-foreground",
};

function LogicalArgument({
  argument,
  depth = 0,
  showStatementLabels = true,
  className,
  children,
  ...props
}: LogicalArgumentProps) {
  return (
    <article
      data-slot="logical-argument"
      data-depth={depth}
      data-status={argument?.status}
      data-relation={argument?.relation}
      className={cn(
        "grid gap-3 rounded-md border bg-card p-4 text-sm text-card-foreground",
        depth > 0 && "border-dashed bg-background p-3",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          {argument ? (
            <>
              {argument.title || argument.description || argument.status || argument.relation ? (
                <LogicalArgumentHeader>
                  <div className="min-w-0">
                    {argument.title ? (
                      <LogicalArgumentTitle>{argument.title}</LogicalArgumentTitle>
                    ) : null}
                    {argument.description ? (
                      <LogicalArgumentDescription>
                        {argument.description}
                      </LogicalArgumentDescription>
                    ) : null}
                  </div>
                  {argument.status || argument.relation ? (
                    <LogicalArgumentMeta>
                      {argument.relation ? (
                        <LogicalArgumentRelationBadge relation={argument.relation} />
                      ) : null}
                      {argument.status ? (
                        <LogicalArgumentStatusBadge status={argument.status} />
                      ) : null}
                    </LogicalArgumentMeta>
                  ) : null}
                </LogicalArgumentHeader>
              ) : null}
              <LogicalArgumentBody>
                <LogicalArgumentPremiseList>
                  {argument.premises.map((premise, index) => (
                    <LogicalArgumentPremise
                      key={premise.id ?? index}
                      label={showStatementLabels ? (premise.label ?? `P${index + 1}`) : undefined}
                      note={premise.note}
                    >
                      {premise.text}
                    </LogicalArgumentPremise>
                  ))}
                </LogicalArgumentPremiseList>
                {argument.inferenceRule ? (
                  <LogicalArgumentInference>{argument.inferenceRule}</LogicalArgumentInference>
                ) : null}
                <LogicalArgumentConclusion
                  label={showStatementLabels ? (argument.conclusion.label ?? "C") : undefined}
                  note={argument.conclusion.note}
                >
                  {argument.conclusion.text}
                </LogicalArgumentConclusion>
              </LogicalArgumentBody>
              {argument.children?.length ? (
                <LogicalArgumentChildren>
                  {argument.children.map((childArgument, index) => (
                    <LogicalArgument
                      key={childArgument.id ?? index}
                      argument={childArgument}
                      depth={depth + 1}
                      showStatementLabels={showStatementLabels}
                    />
                  ))}
                </LogicalArgumentChildren>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </article>
  );
}

function LogicalArgumentHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="logical-argument-header"
      className={cn("flex flex-wrap items-start justify-between gap-3", className)}
      {...props}
    />
  );
}

function LogicalArgumentTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="logical-argument-title"
      className={cn("text-base font-medium leading-snug", className)}
      {...props}
    />
  );
}

function LogicalArgumentDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="logical-argument-description"
      className={cn("mt-1 leading-5 text-muted-foreground", className)}
      {...props}
    />
  );
}

function LogicalArgumentMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="logical-argument-meta"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

function LogicalArgumentBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="logical-argument-body" className={cn("grid gap-3", className)} {...props} />
  );
}

function LogicalArgumentPremiseList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="logical-argument-premise-list"
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}

function LogicalArgumentPremise({
  label,
  note,
  className,
  children,
  ...props
}: LogicalArgumentStatementProps) {
  return (
    <li
      data-slot="logical-argument-premise"
      className={cn(
        "rounded-md border bg-background p-3",
        label ? "grid grid-cols-[auto_1fr] gap-3" : "block",
        className,
      )}
      {...props}
    >
      {label ? <LogicalArgumentStatementLabel>{label}</LogicalArgumentStatementLabel> : null}
      <LogicalArgumentStatementText>
        {children}
        {note ? <LogicalArgumentStatementNote>{note}</LogicalArgumentStatementNote> : null}
      </LogicalArgumentStatementText>
    </li>
  );
}

function LogicalArgumentInference({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="logical-argument-inference"
      className={cn(
        "flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    >
      <CornerDownRightIcon className="size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}

function LogicalArgumentConclusion({
  label,
  note,
  className,
  children,
  ...props
}: LogicalArgumentConclusionProps) {
  return (
    <section
      data-slot="logical-argument-conclusion"
      className={cn(
        "rounded-md border border-primary/25 bg-primary/5 p-3",
        label ? "grid grid-cols-[auto_1fr] gap-3" : "block",
        className,
      )}
      {...props}
    >
      {label ? <LogicalArgumentStatementLabel>{label}</LogicalArgumentStatementLabel> : null}
      <LogicalArgumentStatementText>
        {children}
        {note ? <LogicalArgumentStatementNote>{note}</LogicalArgumentStatementNote> : null}
      </LogicalArgumentStatementText>
    </section>
  );
}

function LogicalArgumentChildren({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="logical-argument-children"
      className={cn("grid gap-3 border-l pl-3", className)}
      {...props}
    />
  );
}

function LogicalArgumentStatementLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="logical-argument-statement-label"
      className={cn(
        "grid min-h-6 min-w-6 place-items-center rounded-md border bg-muted px-1.5 text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function LogicalArgumentStatementText({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="logical-argument-statement-text"
      className={cn("min-w-0 leading-6", className)}
      {...props}
    />
  );
}

function LogicalArgumentStatementNote({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="logical-argument-statement-note"
      className={cn("mt-1 text-xs leading-5 text-muted-foreground", className)}
      {...props}
    />
  );
}

function LogicalArgumentStatusBadge({
  status,
  className,
  children,
  ...props
}: LogicalArgumentStatusBadgeProps) {
  const Icon =
    status === "valid" || status === "sound"
      ? CheckCircle2Icon
      : status === "open"
        ? HelpCircleIcon
        : XCircleIcon;

  return (
    <span
      data-slot="logical-argument-status-badge"
      data-status={status}
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs font-medium",
        statusClassNames[status],
        className,
      )}
      {...props}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {children ?? statusLabels[status]}
    </span>
  );
}

function LogicalArgumentRelationBadge({
  relation,
  className,
  children,
  ...props
}: LogicalArgumentRelationBadgeProps) {
  return (
    <span
      data-slot="logical-argument-relation-badge"
      data-relation={relation}
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs font-medium",
        relationClassNames[relation],
        className,
      )}
      {...props}
    >
      <GitBranchIcon className="size-3.5" aria-hidden="true" />
      {children ?? relationLabels[relation]}
    </span>
  );
}

export {
  LogicalArgument,
  LogicalArgumentBody,
  LogicalArgumentChildren,
  LogicalArgumentConclusion,
  LogicalArgumentDescription,
  LogicalArgumentHeader,
  LogicalArgumentInference,
  LogicalArgumentMeta,
  LogicalArgumentPremise,
  LogicalArgumentPremiseList,
  LogicalArgumentRelationBadge,
  LogicalArgumentStatementLabel,
  LogicalArgumentStatementNote,
  LogicalArgumentStatementText,
  LogicalArgumentStatusBadge,
  LogicalArgumentTitle,
  type LogicalArgumentConclusionProps,
  type LogicalArgumentData,
  type LogicalArgumentProps,
  type LogicalArgumentRelation,
  type LogicalArgumentRelationBadgeProps,
  type LogicalArgumentStatement,
  type LogicalArgumentStatementProps,
  type LogicalArgumentStatus,
  type LogicalArgumentStatusBadgeProps,
};
