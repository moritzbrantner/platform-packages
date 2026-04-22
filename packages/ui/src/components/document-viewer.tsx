"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Maximize2Icon,
  RotateCwIcon,
  SearchIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";

import { cn } from "../lib/cn";
import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";
import { Separator } from "./separator";

type DocumentViewerRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DocumentViewerHighlight = {
  id: string;
  pageId: string;
  rects: DocumentViewerRect[];
  label?: string;
  color?: string;
  metadata?: Record<string, unknown>;
};

type DocumentViewerPageData = {
  id: string;
  pageNumber: number;
  width: number;
  height: number;
  imageSrc?: string;
  text?: string;
  renderPage?: (page: DocumentViewerPageData) => React.ReactNode;
  metadata?: Record<string, unknown>;
};

type DocumentViewerProps = Omit<React.ComponentProps<"div">, "onSelect"> & {
  pages?: DocumentViewerPageData[];
  highlights?: DocumentViewerHighlight[];
  currentPageId?: string | null;
  defaultPageId?: string | null;
  onPageChange?: (page: DocumentViewerPageData) => void;
  selectedHighlightId?: string | null;
  onHighlightSelect?: (highlight: DocumentViewerHighlight | null) => void;
  renderPage?: (page: DocumentViewerPageData) => React.ReactNode;
  loading?: boolean;
  error?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  defaultZoom?: number;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
};

type DocumentViewerToolbarProps = React.ComponentProps<"div"> & {
  pageNumber?: number;
  pageCount: number;
  zoom: number;
  rotation: number;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  onZoomChange?: (zoom: number) => void;
  onFitWidth?: () => void;
  onRotate?: () => void;
};

type DocumentViewerPageProps = React.ComponentProps<"div"> & {
  page: DocumentViewerPageData;
  highlights?: DocumentViewerHighlight[];
  selectedHighlightId?: string | null;
  zoom?: number;
  rotation?: number;
  renderPage?: (page: DocumentViewerPageData) => React.ReactNode;
  onHighlightSelect?: (highlight: DocumentViewerHighlight) => void;
};

type DocumentViewerThumbnailsProps = React.ComponentProps<typeof ScrollArea> & {
  pages: DocumentViewerPageData[];
  currentPageId?: string | null;
  onPageSelect?: (page: DocumentViewerPageData) => void;
};

type DocumentViewerSearchProps = React.ComponentProps<"div"> & {
  query: string;
  matches: DocumentViewerPageData[];
  onQueryChange?: (query: string) => void;
  onMatchSelect?: (page: DocumentViewerPageData) => void;
};

function DocumentViewer({
  pages = [],
  highlights = [],
  currentPageId,
  defaultPageId,
  onPageChange,
  selectedHighlightId,
  onHighlightSelect,
  renderPage,
  loading = false,
  error,
  emptyMessage = "No document pages available.",
  defaultZoom = 1,
  zoom,
  onZoomChange,
  className,
  ...props
}: DocumentViewerProps) {
  const [internalPageId, setInternalPageId] = React.useState<string | null>(
    defaultPageId ?? pages[0]?.id ?? null,
  );
  const [internalZoom, setInternalZoom] = React.useState(defaultZoom);
  const [rotation, setRotation] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const currentZoom = zoom ?? internalZoom;
  const activePageId = currentPageId ?? internalPageId ?? pages[0]?.id ?? null;
  const currentPage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const currentPageIndex = currentPage ? pages.findIndex((page) => page.id === currentPage.id) : -1;
  const normalizedQuery = query.trim().toLowerCase();
  const matches = normalizedQuery
    ? pages.filter((page) => page.text?.toLowerCase().includes(normalizedQuery))
    : [];

  const commitPage = (page: DocumentViewerPageData) => {
    setInternalPageId(page.id);
    onPageChange?.(page);
  };

  const commitZoom = (nextZoom: number) => {
    const safeZoom = Math.min(Math.max(nextZoom, 0.4), 2.5);
    setInternalZoom(safeZoom);
    onZoomChange?.(safeZoom);
  };

  const state = loading ? "loading" : error ? "error" : pages.length === 0 ? "empty" : "ready";

  return (
    <div
      data-slot="document-viewer"
      data-state={state}
      className={cn("grid gap-3 lg:grid-cols-[9rem_minmax(0,1fr)]", className)}
      {...props}
    >
      <DocumentViewerThumbnails pages={pages} currentPageId={currentPage?.id} onPageSelect={commitPage} />
      <div className="min-w-0 space-y-3">
        <DocumentViewerToolbar
          pageNumber={currentPage?.pageNumber}
          pageCount={pages.length}
          zoom={currentZoom}
          rotation={rotation}
          canGoPrevious={currentPageIndex > 0}
          canGoNext={currentPageIndex >= 0 && currentPageIndex < pages.length - 1}
          onPreviousPage={() => pages[currentPageIndex - 1] && commitPage(pages[currentPageIndex - 1])}
          onNextPage={() => pages[currentPageIndex + 1] && commitPage(pages[currentPageIndex + 1])}
          onZoomChange={commitZoom}
          onFitWidth={() => commitZoom(1.25)}
          onRotate={() => setRotation((value) => (value + 90) % 360)}
        />
        <DocumentViewerSearch
          query={query}
          matches={matches}
          onQueryChange={setQuery}
          onMatchSelect={commitPage}
        />
        <ScrollArea className="h-[34rem] rounded-md border bg-muted/20">
          {loading ? (
            <DocumentViewerState label="Loading document" />
          ) : error ? (
            <DocumentViewerState label={error} tone="error" />
          ) : currentPage ? (
            <div className="grid min-h-full place-items-start justify-center p-6">
              <DocumentViewerPage
                page={currentPage}
                highlights={highlights.filter((highlight) => highlight.pageId === currentPage.id)}
                selectedHighlightId={selectedHighlightId}
                zoom={currentZoom}
                rotation={rotation}
                renderPage={renderPage}
                onHighlightSelect={onHighlightSelect ?? undefined}
              />
            </div>
          ) : (
            <DocumentViewerState label={emptyMessage} />
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

function DocumentViewerToolbar({
  pageNumber,
  pageCount,
  zoom,
  rotation,
  canGoPrevious,
  canGoNext,
  onPreviousPage,
  onNextPage,
  onZoomChange,
  onFitWidth,
  onRotate,
  className,
  ...props
}: DocumentViewerToolbarProps) {
  return (
    <div
      data-slot="document-viewer-toolbar"
      role="toolbar"
      aria-label="Document viewer controls"
      className={cn("flex flex-wrap items-center justify-between gap-2", className)}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={!canGoPrevious}
          onClick={onPreviousPage}
        >
          <ChevronLeftIcon />
        </Button>
        <Badge variant="secondary">
          Page {pageNumber ?? 0} of {pageCount}
        </Badge>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={!canGoNext}
          onClick={onNextPage}
        >
          <ChevronRightIcon />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon-sm" aria-label="Zoom out" onClick={() => onZoomChange?.(zoom - 0.1)}>
          <ZoomOutIcon />
        </Button>
        <Button type="button" variant="outline" size="sm" aria-label="Reset zoom" onClick={() => onZoomChange?.(1)}>
          {Math.round(zoom * 100)}%
        </Button>
        <Button type="button" variant="outline" size="icon-sm" aria-label="Zoom in" onClick={() => onZoomChange?.(zoom + 0.1)}>
          <ZoomInIcon />
        </Button>
        <Button type="button" variant="outline" size="icon-sm" aria-label="Fit width" onClick={onFitWidth}>
          <Maximize2Icon />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button type="button" variant="outline" size="icon-sm" aria-label={`Rotate page ${rotation} degrees`} onClick={onRotate}>
          <RotateCwIcon />
        </Button>
      </div>
    </div>
  );
}

function DocumentViewerSearch({
  query,
  matches,
  onQueryChange,
  onMatchSelect,
  className,
  ...props
}: DocumentViewerSearchProps) {
  return (
    <div
      data-slot="document-viewer-search"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    >
      <div className="relative min-w-56 flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search document"
          value={query}
          onChange={(event) => onQueryChange?.(event.target.value)}
          placeholder="Search document"
          className="pl-8"
        />
      </div>
      {query ? <Badge variant="outline">{matches.length} matches</Badge> : null}
      {matches.slice(0, 3).map((page) => (
        <Button key={page.id} type="button" variant="ghost" size="sm" onClick={() => onMatchSelect?.(page)}>
          Page {page.pageNumber}
        </Button>
      ))}
    </div>
  );
}

function DocumentViewerThumbnails({
  pages,
  currentPageId,
  onPageSelect,
  className,
  ...props
}: DocumentViewerThumbnailsProps) {
  return (
    <ScrollArea
      data-slot="document-viewer-thumbnails"
      className={cn("h-[40rem] rounded-md border bg-muted/20", className)}
      {...props}
    >
      <div className="grid gap-2 p-2">
        {pages.length === 0 ? (
          <div className="p-3 text-center text-xs text-muted-foreground">No pages</div>
        ) : (
          pages.map((page) => (
            <button
              key={page.id}
              type="button"
              data-slot="document-viewer-thumbnail"
              data-selected={page.id === currentPageId ? "true" : undefined}
              aria-label={`Thumbnail page ${page.pageNumber}`}
              className="grid aspect-[3/4] place-items-center rounded-md border bg-card p-2 text-xs font-medium text-card-foreground outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[selected=true]:border-primary data-[selected=true]:bg-primary/10"
              onClick={() => onPageSelect?.(page)}
            >
              {page.imageSrc ? <img src={page.imageSrc} alt="" className="max-h-full max-w-full object-contain" /> : null}
              <span>Page {page.pageNumber}</span>
            </button>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

function DocumentViewerPage({
  page,
  highlights = [],
  selectedHighlightId,
  zoom = 1,
  rotation = 0,
  renderPage,
  onHighlightSelect,
  className,
  ...props
}: DocumentViewerPageProps) {
  const customPage = renderPage?.(page) ?? page.renderPage?.(page);
  const pageWidth = page.width * zoom;
  const pageHeight = page.height * zoom;

  return (
    <div
      data-slot="document-viewer-page"
      aria-label={`Document page ${page.pageNumber}`}
      className={cn("relative origin-center bg-background shadow-sm ring-1 ring-border", className)}
      style={{
        width: pageWidth,
        height: pageHeight,
        transform: `rotate(${rotation}deg)`,
      }}
      {...props}
    >
      {customPage ? (
        customPage
      ) : page.imageSrc ? (
        <img src={page.imageSrc} alt="" className="size-full object-contain" />
      ) : (
        <div className="size-full whitespace-pre-wrap p-6 text-sm leading-6">{page.text}</div>
      )}
      <div data-slot="document-viewer-highlight-layer" className="pointer-events-none absolute inset-0">
        {highlights.flatMap((highlight) =>
          highlight.rects.map((rect, index) => (
            <button
              key={`${highlight.id}-${index}`}
              type="button"
              data-slot="document-viewer-highlight"
              data-selected={highlight.id === selectedHighlightId ? "true" : undefined}
              aria-label={highlight.label ?? `Highlight ${highlight.id}`}
              className="pointer-events-auto absolute rounded-[2px] border border-primary/60 bg-primary/20 outline-none transition-colors hover:bg-primary/30 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[selected=true]:border-primary data-[selected=true]:bg-primary/40"
              style={{
                left: `${rect.x * 100}%`,
                top: `${rect.y * 100}%`,
                width: `${rect.width * 100}%`,
                height: `${rect.height * 100}%`,
                backgroundColor: highlight.color ? `${highlight.color}33` : undefined,
                borderColor: highlight.color,
              }}
              onClick={() => onHighlightSelect?.(highlight)}
            />
          )),
        )}
      </div>
    </div>
  );
}

function DocumentViewerState({
  label,
  tone,
}: {
  label: React.ReactNode;
  tone?: "error";
}) {
  return (
    <div
      data-slot="document-viewer-state"
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "grid min-h-80 place-items-center p-6 text-center text-sm text-muted-foreground",
        tone === "error" && "text-destructive",
      )}
    >
      {label}
    </div>
  );
}

export {
  DocumentViewer,
  DocumentViewerPage,
  DocumentViewerSearch,
  DocumentViewerThumbnails,
  DocumentViewerToolbar,
};
export type {
  DocumentViewerHighlight,
  DocumentViewerPageData,
  DocumentViewerProps,
  DocumentViewerRect,
};
