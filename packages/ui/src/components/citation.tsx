"use client";

import * as React from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  FileTextIcon,
  InfoIcon,
  LinkIcon,
} from "lucide-react";

import { cn } from "../lib/cn";

type CitationStatus = "cited" | "supporting" | "disputed" | "missing";

type CitationData = {
  id?: string;
  label?: React.ReactNode;
  title: React.ReactNode;
  authors?: readonly React.ReactNode[];
  source?: React.ReactNode;
  publisher?: React.ReactNode;
  issued?: React.ReactNode;
  accessed?: React.ReactNode;
  locator?: React.ReactNode;
  url?: string;
  excerpt?: React.ReactNode;
  note?: React.ReactNode;
  status?: CitationStatus;
};

type CitationListProps = React.ComponentProps<"ol"> & {
  citations?: readonly CitationData[];
  compact?: boolean;
};

type CitationItemProps = React.ComponentProps<"li"> & {
  citation?: CitationData;
  compact?: boolean;
};

type CitationReferenceProps = React.ComponentProps<"sup"> & {
  label: React.ReactNode;
  href?: string;
};

type CitationStatusBadgeProps = React.ComponentProps<"span"> & {
  status: CitationStatus;
};

const statusLabels: Record<CitationStatus, string> = {
  cited: "Cited",
  disputed: "Disputed",
  missing: "Missing",
  supporting: "Supporting",
};

const statusClassNames: Record<CitationStatus, string> = {
  cited: "border-primary/30 bg-primary/10 text-primary",
  disputed:
    "border-destructive/35 bg-destructive/10 text-red-700 dark:bg-destructive/20 dark:text-red-300",
  missing: "border-border bg-muted text-muted-foreground",
  supporting: "border-primary/30 bg-primary/10 text-primary",
};

function CitationList({
  citations,
  compact = false,
  className,
  children,
  ...props
}: CitationListProps) {
  return (
    <ol
      data-slot="citation-list"
      data-compact={compact ? "true" : undefined}
      className={cn("grid gap-3 text-sm", compact && "gap-2", className)}
      {...props}
    >
      {children ??
        citations?.map((citation, index) => (
          <CitationItem
            key={citation.id ?? index}
            citation={{
              ...citation,
              label: citation.label ?? index + 1,
            }}
            compact={compact}
          />
        ))}
    </ol>
  );
}

function CitationItem({
  citation,
  compact = false,
  className,
  children,
  ...props
}: CitationItemProps) {
  return (
    <li
      data-slot="citation-item"
      data-status={citation?.status}
      data-compact={compact ? "true" : undefined}
      className={cn(
        "grid gap-3 rounded-md border bg-card p-4 text-card-foreground",
        compact && "grid-cols-[auto_1fr] gap-3 p-3",
        className,
      )}
      {...props}
    >
      {children ??
        (citation ? (
          <>
            <CitationHeader>
              <CitationMarker>{citation.label}</CitationMarker>
              <div className="min-w-0">
                <CitationTitle href={citation.url}>{citation.title}</CitationTitle>
                <CitationMeta>{formatCitationMeta(citation)}</CitationMeta>
              </div>
              {citation.status ? <CitationStatusBadge status={citation.status} /> : null}
            </CitationHeader>
            {citation.excerpt ? <CitationExcerpt>{citation.excerpt}</CitationExcerpt> : null}
            {citation.note ? <CitationNote>{citation.note}</CitationNote> : null}
          </>
        ) : null)}
    </li>
  );
}

function CitationReference({ label, href, className, children, ...props }: CitationReferenceProps) {
  const content = children ?? label;

  return (
    <sup
      data-slot="citation-reference"
      className={cn("align-super text-[0.75em] leading-none", className)}
      {...props}
    >
      {href ? (
        <a
          href={href}
          className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-md border bg-muted px-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {content}
        </a>
      ) : (
        <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-md border bg-muted px-1.5 font-medium text-muted-foreground">
          {content}
        </span>
      )}
    </sup>
  );
}

function CitationHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="citation-header"
      className={cn("grid grid-cols-[auto_1fr_auto] items-start gap-3", className)}
      {...props}
    />
  );
}

function CitationMarker({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="citation-marker"
      className={cn(
        "grid min-h-7 min-w-7 place-items-center rounded-md border bg-muted px-2 text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CitationTitle({
  href,
  className,
  children,
  ...props
}: React.ComponentProps<"a"> & { href?: string }) {
  if (href) {
    return (
      <a
        data-slot="citation-title"
        href={href}
        className={cn(
          "inline-flex min-w-0 items-center gap-1.5 font-medium leading-5 text-foreground underline-offset-4 hover:underline",
          className,
        )}
        {...props}
      >
        <span className="min-w-0">{children}</span>
        <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </a>
    );
  }

  return (
    <span
      data-slot="citation-title"
      className={cn("block min-w-0 font-medium leading-5 text-foreground", className)}
    >
      {children}
    </span>
  );
}

function CitationMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="citation-meta"
      className={cn(
        "mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CitationMetaItem({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="citation-meta-item"
      className={cn("inline-flex min-w-0 items-center gap-1", className)}
      {...props}
    />
  );
}

function CitationExcerpt({ className, ...props }: React.ComponentProps<"blockquote">) {
  return (
    <blockquote
      data-slot="citation-excerpt"
      className={cn(
        "border-l-2 border-border pl-3 text-sm leading-6 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CitationNote({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="citation-note"
      className={cn(
        "rounded-md bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CitationStatusBadge({ status, className, children, ...props }: CitationStatusBadgeProps) {
  const Icon =
    status === "disputed" ? AlertTriangleIcon : status === "missing" ? InfoIcon : CheckCircle2Icon;

  return (
    <span
      data-slot="citation-status-badge"
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

function formatCitationMeta(citation: CitationData) {
  const items: React.ReactNode[] = [];

  if (citation.authors?.length) {
    items.push(formatCitationAuthors(citation.authors));
  }
  if (citation.source) {
    items.push(
      <>
        <FileTextIcon className="size-3.5 shrink-0" aria-hidden="true" />
        {citation.source}
      </>,
    );
  }
  if (citation.publisher) {
    items.push(citation.publisher);
  }
  if (citation.issued) {
    items.push(citation.issued);
  }
  if (citation.locator) {
    items.push(citation.locator);
  }
  if (citation.accessed) {
    items.push(<>Accessed {citation.accessed}</>);
  }
  if (citation.url) {
    items.push(
      <>
        <LinkIcon className="size-3.5 shrink-0" aria-hidden="true" />
        URL
      </>,
    );
  }

  return items.map((item, index) => (
    <React.Fragment key={index}>
      {index > 0 ? <span aria-hidden="true">/</span> : null}
      <CitationMetaItem>{item}</CitationMetaItem>
    </React.Fragment>
  ));
}

function formatCitationAuthors(authors: readonly React.ReactNode[]) {
  return authors.map((author, index) => (
    <React.Fragment key={index}>
      {index > 0 ? ", " : null}
      {author}
    </React.Fragment>
  ));
}

export {
  CitationExcerpt,
  CitationHeader,
  CitationItem,
  CitationList,
  CitationMarker,
  CitationMeta,
  CitationMetaItem,
  CitationNote,
  CitationReference,
  CitationStatusBadge,
  CitationTitle,
  type CitationData,
  type CitationItemProps,
  type CitationListProps,
  type CitationReferenceProps,
  type CitationStatus,
  type CitationStatusBadgeProps,
};
