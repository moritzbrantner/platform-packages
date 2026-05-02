"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
} from "lucide-react";

import { cn } from "../lib/cn";

type TreeViewNode = {
  id: string;
  label: React.ReactNode;
  children?: readonly TreeViewNode[];
  icon?: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
  defaultExpanded?: boolean;
};

type TreeViewProps = Omit<React.ComponentProps<"div">, "onSelect"> & {
  nodes: readonly TreeViewNode[];
  selectedId?: string;
  defaultSelectedId?: string;
  onSelectedIdChange?: (nodeId: string, node: TreeViewNode) => void;
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedIdsChange?: (nodeIds: string[], node: TreeViewNode) => void;
  expandOnSelect?: boolean;
  emptyMessage?: React.ReactNode;
};

type TreeViewNodeEntry = {
  node: TreeViewNode;
  depth: number;
  parentId?: string;
};

type TreeViewNodeProps = {
  entry: TreeViewNodeEntry;
  expandedIds: Set<string>;
  selectedId?: string;
  activeId?: string;
  onFocusNode: (nodeId: string) => void;
  onSelectNode: (node: TreeViewNode) => void;
  onToggleNode: (node: TreeViewNode) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>, entry: TreeViewNodeEntry) => void;
  registerNode: (nodeId: string, element: HTMLDivElement | null) => void;
};

function TreeView({
  nodes,
  selectedId,
  defaultSelectedId,
  onSelectedIdChange,
  expandedIds,
  defaultExpandedIds = [],
  onExpandedIdsChange,
  expandOnSelect = true,
  emptyMessage = "No folders found.",
  className,
  ...props
}: TreeViewProps) {
  const defaultExpandedNodeIds = React.useMemo(() => collectDefaultExpandedIds(nodes), [nodes]);
  const [internalExpandedIds, setInternalExpandedIds] = React.useState<string[]>([
    ...defaultExpandedNodeIds,
    ...defaultExpandedIds,
  ]);
  const [internalSelectedId, setInternalSelectedId] = React.useState(defaultSelectedId);
  const currentExpandedIds = React.useMemo(
    () => new Set(expandedIds ?? internalExpandedIds),
    [expandedIds, internalExpandedIds],
  );
  const currentSelectedId = selectedId ?? internalSelectedId;
  const visibleEntries = React.useMemo(
    () => flattenVisibleNodes(nodes, currentExpandedIds),
    [currentExpandedIds, nodes],
  );
  const firstFocusableId = visibleEntries.find((entry) => !entry.node.disabled)?.node.id;
  const [activeId, setActiveId] = React.useState(currentSelectedId ?? firstFocusableId);
  const nodeRefs = React.useRef(new Map<string, HTMLDivElement>());

  React.useEffect(() => {
    if (currentSelectedId && visibleEntries.some((entry) => entry.node.id === currentSelectedId)) {
      setActiveId(currentSelectedId);
      return;
    }

    setActiveId((currentActiveId) =>
      currentActiveId && visibleEntries.some((entry) => entry.node.id === currentActiveId)
        ? currentActiveId
        : firstFocusableId,
    );
  }, [currentSelectedId, firstFocusableId, visibleEntries]);

  const registerNode = React.useCallback((nodeId: string, element: HTMLDivElement | null) => {
    if (element) {
      nodeRefs.current.set(nodeId, element);
      return;
    }

    nodeRefs.current.delete(nodeId);
  }, []);

  const focusNode = React.useCallback((nodeId: string) => {
    setActiveId(nodeId);
    nodeRefs.current.get(nodeId)?.focus();
  }, []);

  const commitExpandedIds = React.useCallback(
    (nextExpandedIds: string[], node: TreeViewNode) => {
      if (!expandedIds) {
        setInternalExpandedIds(nextExpandedIds);
      }
      onExpandedIdsChange?.(nextExpandedIds, node);
    },
    [expandedIds, onExpandedIdsChange],
  );

  const toggleNode = React.useCallback(
    (node: TreeViewNode, forceExpanded?: boolean) => {
      if (!isExpandableNode(node) || node.disabled) {
        return;
      }

      const shouldExpand = forceExpanded ?? !currentExpandedIds.has(node.id);
      const nextExpandedIds = shouldExpand
        ? Array.from(new Set([...currentExpandedIds, node.id]))
        : Array.from(currentExpandedIds).filter((nodeId) => nodeId !== node.id);

      commitExpandedIds(nextExpandedIds, node);
    },
    [commitExpandedIds, currentExpandedIds],
  );

  const selectNode = React.useCallback(
    (node: TreeViewNode) => {
      if (node.disabled) {
        return;
      }

      setInternalSelectedId(node.id);
      onSelectedIdChange?.(node.id, node);

      if (expandOnSelect && isExpandableNode(node)) {
        toggleNode(node);
      }
    },
    [expandOnSelect, onSelectedIdChange, toggleNode],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, entry: TreeViewNodeEntry) => {
      const focusableEntries = visibleEntries.filter((visibleEntry) => !visibleEntry.node.disabled);
      const currentIndex = focusableEntries.findIndex(
        (visibleEntry) => visibleEntry.node.id === entry.node.id,
      );
      const nextEntry = focusableEntries[currentIndex + 1];
      const previousEntry = focusableEntries[currentIndex - 1];

      if (event.key === "ArrowDown" && nextEntry) {
        event.preventDefault();
        focusNode(nextEntry.node.id);
      }

      if (event.key === "ArrowUp" && previousEntry) {
        event.preventDefault();
        focusNode(previousEntry.node.id);
      }

      if (event.key === "Home" && focusableEntries[0]) {
        event.preventDefault();
        focusNode(focusableEntries[0].node.id);
      }

      if (event.key === "End" && focusableEntries.at(-1)) {
        event.preventDefault();
        focusNode(focusableEntries.at(-1)!.node.id);
      }

      if (event.key === "ArrowRight" && isExpandableNode(entry.node)) {
        event.preventDefault();
        if (currentExpandedIds.has(entry.node.id)) {
          const firstChild = entry.node.children?.find((childNode) => !childNode.disabled);
          if (firstChild) {
            focusNode(firstChild.id);
          }
          return;
        }
        toggleNode(entry.node, true);
      }

      if (event.key === "ArrowLeft") {
        if (isExpandableNode(entry.node) && currentExpandedIds.has(entry.node.id)) {
          event.preventDefault();
          toggleNode(entry.node, false);
          return;
        }

        if (entry.parentId) {
          event.preventDefault();
          focusNode(entry.parentId);
        }
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectNode(entry.node);
      }
    },
    [currentExpandedIds, focusNode, selectNode, toggleNode, visibleEntries],
  );

  if (nodes.length === 0) {
    return (
      <div
        data-slot="tree-view"
        className={cn(
          "grid min-h-24 place-items-center rounded-md border bg-card p-4 text-sm text-muted-foreground",
          className,
        )}
        {...props}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      data-slot="tree-view"
      role="tree"
      className={cn("w-full rounded-md border bg-card p-1 text-card-foreground", className)}
      {...props}
    >
      {nodes.map((node) => (
        <TreeViewNodeItem
          key={node.id}
          entry={{ node, depth: 0 }}
          expandedIds={currentExpandedIds}
          selectedId={currentSelectedId}
          activeId={activeId}
          onFocusNode={setActiveId}
          onSelectNode={selectNode}
          onToggleNode={toggleNode}
          onKeyDown={handleKeyDown}
          registerNode={registerNode}
        />
      ))}
    </div>
  );
}

function TreeViewNodeItem({
  entry,
  expandedIds,
  selectedId,
  activeId,
  onFocusNode,
  onSelectNode,
  onToggleNode,
  onKeyDown,
  registerNode,
}: TreeViewNodeProps) {
  const { node, depth } = entry;
  const expanded = expandedIds.has(node.id);
  const selected = selectedId === node.id;
  const nodeHasChildren = isExpandableNode(node);
  const icon = node.icon ?? getDefaultNodeIcon(node, expanded);

  return (
    <div data-slot="tree-view-node" role="none">
      <div
        ref={(element) => registerNode(node.id, element)}
        data-slot="tree-view-item"
        role="treeitem"
        id={node.id}
        aria-level={depth + 1}
        aria-expanded={nodeHasChildren ? expanded : undefined}
        aria-selected={selected}
        aria-disabled={node.disabled || undefined}
        tabIndex={activeId === node.id && !node.disabled ? 0 : -1}
        className={cn(
          "flex min-h-8 w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 text-left text-sm outline-none transition-colors",
          "hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
          "aria-selected:bg-accent aria-selected:text-accent-foreground aria-selected:[&_span[data-slot=tree-view-label]]:font-medium",
          "aria-disabled:pointer-events-none aria-disabled:opacity-50",
        )}
        style={{ paddingInlineStart: `${0.5 + depth * 1}rem` }}
        onClick={() => onSelectNode(node)}
        onFocus={() => onFocusNode(node.id)}
        onKeyDown={(event) => onKeyDown(event, entry)}
      >
        <span
          data-slot="tree-view-disclosure"
          aria-hidden="true"
          className="grid size-4 shrink-0 place-items-center text-muted-foreground"
          onClick={(event) => {
            if (!nodeHasChildren) {
              return;
            }

            event.stopPropagation();
            onToggleNode(node);
          }}
        >
          {nodeHasChildren ? (
            expanded ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronRightIcon className="size-4" />
            )
          ) : null}
        </span>
        <span
          data-slot="tree-view-icon"
          aria-hidden="true"
          className="grid size-4 shrink-0 place-items-center text-muted-foreground [&_svg]:size-4"
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span data-slot="tree-view-label" className="block truncate">
            {node.label}
          </span>
          {node.description ? (
            <span
              data-slot="tree-view-description"
              className="block truncate text-xs text-muted-foreground"
            >
              {node.description}
            </span>
          ) : null}
        </span>
        {node.badge ? (
          <span data-slot="tree-view-badge" className="shrink-0 text-xs text-muted-foreground">
            {node.badge}
          </span>
        ) : null}
      </div>
      {nodeHasChildren && expanded ? (
        <div role="group" data-slot="tree-view-group">
          {node.children?.map((childNode) => (
            <TreeViewNodeItem
              key={childNode.id}
              entry={{ node: childNode, depth: depth + 1, parentId: node.id }}
              expandedIds={expandedIds}
              selectedId={selectedId}
              activeId={activeId}
              onFocusNode={onFocusNode}
              onSelectNode={onSelectNode}
              onToggleNode={onToggleNode}
              onKeyDown={onKeyDown}
              registerNode={registerNode}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function isFolderNode(node: TreeViewNode) {
  return Array.isArray(node.children);
}

function isExpandableNode(node: TreeViewNode) {
  return Boolean(node.children?.length);
}

function getDefaultNodeIcon(node: TreeViewNode, expanded: boolean) {
  if (isFolderNode(node)) {
    return expanded ? <FolderOpenIcon /> : <FolderIcon />;
  }

  return <FileIcon />;
}

function collectDefaultExpandedIds(nodes: readonly TreeViewNode[]) {
  const expandedNodeIds: string[] = [];

  for (const node of nodes) {
    if (node.defaultExpanded && isExpandableNode(node)) {
      expandedNodeIds.push(node.id);
    }

    if (node.children) {
      expandedNodeIds.push(...collectDefaultExpandedIds(node.children));
    }
  }

  return expandedNodeIds;
}

function flattenVisibleNodes(
  nodes: readonly TreeViewNode[],
  expandedIds: Set<string>,
  depth = 0,
  parentId?: string,
) {
  const entries: TreeViewNodeEntry[] = [];

  for (const node of nodes) {
    entries.push({ node, depth, parentId });

    if (node.children && expandedIds.has(node.id)) {
      entries.push(...flattenVisibleNodes(node.children, expandedIds, depth + 1, node.id));
    }
  }

  return entries;
}

export { TreeView };
export type { TreeViewNode, TreeViewProps };
