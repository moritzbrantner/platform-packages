"use client";

import * as React from "react";
import {
  FileArchiveIcon,
  FileAudioIcon,
  FileIcon,
  FileImageIcon,
  FileTextIcon,
  FileVideoIcon,
  FolderIcon,
  Grid2X2Icon,
  ListIcon,
  UploadIcon,
} from "lucide-react";

import { cn } from "../lib/cn";
import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";

type AssetBrowserView = "grid" | "list";
type AssetBrowserSelectionMode = "none" | "single" | "multiple";
type AssetBrowserItemType =
  | "folder"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "file";

type AssetBrowserItem = {
  id: string;
  name: string;
  type: AssetBrowserItemType;
  url?: string;
  thumbnailUrl?: string;
  mimeType?: string;
  size?: number;
  updatedAt?: string | Date;
  description?: string;
  metadata?: Record<string, React.ReactNode>;
};

type AssetBrowserProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  items: AssetBrowserItem[];
  view?: AssetBrowserView;
  defaultView?: AssetBrowserView;
  onViewChange?: (view: AssetBrowserView) => void;
  selectionMode?: AssetBrowserSelectionMode;
  selectedItemIds?: string[];
  defaultSelectedItemIds?: string[];
  onSelectionChange?: (itemIds: string[], items: AssetBrowserItem[]) => void;
  onOpenItem?: (item: AssetBrowserItem) => void;
  onUpload?: (files: File[]) => void;
  uploadLabel?: string;
  searchPlaceholder?: string;
  emptyMessage?: React.ReactNode;
  showPreview?: boolean;
};

type AssetBrowserItemCardProps = React.ComponentProps<"button"> & {
  item: AssetBrowserItem;
  selected?: boolean;
};

type AssetBrowserItemRowProps = React.ComponentProps<"button"> & {
  item: AssetBrowserItem;
  selected?: boolean;
};

type AssetBrowserPreviewProps = React.ComponentProps<"aside"> & {
  item?: AssetBrowserItem;
};

function AssetBrowser({
  items,
  view,
  defaultView = "grid",
  onViewChange,
  selectionMode = "single",
  selectedItemIds,
  defaultSelectedItemIds = [],
  onSelectionChange,
  onOpenItem,
  onUpload,
  uploadLabel = "Upload files",
  searchPlaceholder = "Search assets...",
  emptyMessage = "No assets found.",
  showPreview = true,
  className,
  ...props
}: AssetBrowserProps) {
  const [internalView, setInternalView] = React.useState<AssetBrowserView>(defaultView);
  const [query, setQuery] = React.useState("");
  const [internalSelection, setInternalSelection] =
    React.useState<string[]>(defaultSelectedItemIds);
  const currentView = view ?? internalView;
  const currentSelection = selectedItemIds ?? internalSelection;
  const selectedItems = items.filter((item) => currentSelection.includes(item.id));
  const previewItem = selectedItems.at(-1);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleItems = normalizedQuery
    ? items.filter((item) =>
        [item.name, item.type, item.mimeType, item.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
      )
    : items;

  const setView = (nextView: AssetBrowserView) => {
    setInternalView(nextView);
    onViewChange?.(nextView);
  };

  const commitSelection = (nextSelection: string[]) => {
    setInternalSelection(nextSelection);
    onSelectionChange?.(
      nextSelection,
      items.filter((item) => nextSelection.includes(item.id)),
    );
  };

  const toggleItem = (item: AssetBrowserItem) => {
    if (selectionMode === "none") {
      return;
    }

    if (selectionMode === "single") {
      commitSelection(currentSelection.includes(item.id) ? [] : [item.id]);
      return;
    }

    commitSelection(
      currentSelection.includes(item.id)
        ? currentSelection.filter((itemId) => itemId !== item.id)
        : [...currentSelection, item.id],
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      onUpload?.(files);
    }
    event.target.value = "";
  };

  return (
    <div
      data-slot="asset-browser"
      data-view={currentView}
      className={cn("grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]", className)}
      {...props}
    >
      <div className="min-w-0 space-y-4">
        <div
          data-slot="asset-browser-toolbar"
          className="flex flex-wrap items-center justify-between gap-2"
        >
          <Input
            aria-label="Search assets"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="max-w-sm"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={currentView === "grid" ? "secondary" : "outline"}
              size="icon-sm"
              aria-label="Grid view"
              aria-pressed={currentView === "grid"}
              onClick={() => setView("grid")}
            >
              <Grid2X2Icon />
            </Button>
            <Button
              type="button"
              variant={currentView === "list" ? "secondary" : "outline"}
              size="icon-sm"
              aria-label="List view"
              aria-pressed={currentView === "list"}
              onClick={() => setView("list")}
            >
              <ListIcon />
            </Button>
            {onUpload ? (
              <Button asChild type="button" variant="outline" size="sm">
                <label>
                  <UploadIcon />
                  {uploadLabel}
                  <input
                    aria-label={uploadLabel}
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </Button>
            ) : null}
          </div>
        </div>
        <ScrollArea className="h-[28rem] rounded-md border">
          {visibleItems.length === 0 ? (
            <div className="grid h-40 place-items-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : currentView === "grid" ? (
            <div
              role="listbox"
              aria-label="Assets"
              aria-multiselectable={selectionMode === "multiple" ? true : undefined}
              className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              {visibleItems.map((item) => (
                <AssetBrowserItemCard
                  key={item.id}
                  item={item}
                  selected={currentSelection.includes(item.id)}
                  role="option"
                  aria-selected={currentSelection.includes(item.id)}
                  onClick={() => toggleItem(item)}
                  onDoubleClick={() => onOpenItem?.(item)}
                />
              ))}
            </div>
          ) : (
            <div
              role="listbox"
              aria-label="Assets"
              aria-multiselectable={selectionMode === "multiple" ? true : undefined}
              className="divide-y"
            >
              {visibleItems.map((item) => (
                <AssetBrowserItemRow
                  key={item.id}
                  item={item}
                  selected={currentSelection.includes(item.id)}
                  role="option"
                  aria-selected={currentSelection.includes(item.id)}
                  onClick={() => toggleItem(item)}
                  onDoubleClick={() => onOpenItem?.(item)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
      {showPreview ? <AssetBrowserPreview item={previewItem} /> : null}
    </div>
  );
}

function AssetBrowserItemCard({
  item,
  selected,
  className,
  ...props
}: AssetBrowserItemCardProps) {
  return (
    <button
      type="button"
      data-slot="asset-browser-item-card"
      data-selected={selected ? "true" : undefined}
      className={cn(
        "group grid min-h-40 gap-3 rounded-md border bg-card p-3 text-left text-card-foreground outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[selected=true]:border-primary data-[selected=true]:bg-primary/10",
        className,
      )}
      {...props}
    >
      <AssetBrowserThumbnail item={item} className="h-24" />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{item.name}</div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{item.type}</Badge>
          {item.size ? <span>{formatAssetSize(item.size)}</span> : null}
        </div>
      </div>
    </button>
  );
}

function AssetBrowserItemRow({ item, selected, className, ...props }: AssetBrowserItemRowProps) {
  const Icon = getAssetIcon(item.type);

  return (
    <button
      type="button"
      data-slot="asset-browser-item-row"
      data-selected={selected ? "true" : undefined}
      className={cn(
        "grid w-full grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[selected=true]:bg-primary/10",
        className,
      )}
      {...props}
    >
      <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{item.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {item.description ?? item.mimeType ?? item.type}
        </span>
      </span>
      <span className="text-xs text-muted-foreground">
        {item.size ? formatAssetSize(item.size) : ""}
      </span>
    </button>
  );
}

function AssetBrowserPreview({ item, className, ...props }: AssetBrowserPreviewProps) {
  return (
    <aside
      data-slot="asset-browser-preview"
      className={cn("rounded-md border bg-card p-4 text-card-foreground", className)}
      {...props}
    >
      {item ? (
        <div className="space-y-4">
          <AssetBrowserThumbnail item={item} className="h-40" />
          <div>
            <h3 className="break-words text-sm font-semibold">{item.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{item.description ?? item.mimeType}</p>
          </div>
          <dl className="grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Type</dt>
              <dd>{item.type}</dd>
            </div>
            {item.size ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Size</dt>
                <dd>{formatAssetSize(item.size)}</dd>
              </div>
            ) : null}
            {item.updatedAt ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Updated</dt>
                <dd>{formatAssetDate(item.updatedAt)}</dd>
              </div>
            ) : null}
            {item.metadata
              ? Object.entries(item.metadata).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))
              : null}
          </dl>
        </div>
      ) : (
        <div className="grid h-full min-h-40 place-items-center text-center text-sm text-muted-foreground">
          No asset selected.
        </div>
      )}
    </aside>
  );
}

function AssetBrowserThumbnail({
  item,
  className,
}: {
  item: AssetBrowserItem;
  className?: string;
}) {
  const Icon = getAssetIcon(item.type);
  const imageUrl = item.thumbnailUrl ?? (item.type === "image" ? item.url : undefined);

  return (
    <div
      data-slot="asset-browser-thumbnail"
      className={cn(
        "grid place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground",
        className,
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="size-full object-cover" />
      ) : (
        <Icon aria-hidden="true" className="size-8" />
      )}
    </div>
  );
}

function getAssetIcon(type: AssetBrowserItemType) {
  switch (type) {
    case "folder":
      return FolderIcon;
    case "image":
      return FileImageIcon;
    case "video":
      return FileVideoIcon;
    case "audio":
      return FileAudioIcon;
    case "document":
      return FileTextIcon;
    case "archive":
      return FileArchiveIcon;
    default:
      return FileIcon;
  }
}

function formatAssetSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatAssetDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

export { AssetBrowser, AssetBrowserItemCard, AssetBrowserItemRow, AssetBrowserPreview };
export type { AssetBrowserItem, AssetBrowserProps, AssetBrowserSelectionMode, AssetBrowserView };
