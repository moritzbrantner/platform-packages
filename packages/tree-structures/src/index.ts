export type TreeNodeId = string | number;

export type TreeTraversalOrder = "preorder" | "postorder" | "breadth-first";

export type FlatTreeNode<TData = Record<string, unknown>> = {
  data?: TData;
  id: TreeNodeId;
  label?: string;
  parentId?: TreeNodeId | null;
};

export type IndexedTreeNode<TData = Record<string, unknown>> = {
  children: Array<IndexedTreeNode<TData>>;
  data: TData;
  depth: number;
  id: string;
  index: number;
  label: string;
  parentId: string | null;
  path: string[];
};

export type TreeIndexOptions<TData = Record<string, unknown>> = {
  missingParent?: "error" | "root";
  sortSiblings?: (
    left: IndexedTreeNode<TData>,
    right: IndexedTreeNode<TData>,
  ) => number;
};

export type TreeFlattenOptions = {
  order?: TreeTraversalOrder;
};

export type TreeIndex<TData = Record<string, unknown>> = {
  flatten(options?: TreeFlattenOptions): Array<IndexedTreeNode<TData>>;
  getAncestors(nodeId: TreeNodeId): Array<IndexedTreeNode<TData>>;
  getChildren(nodeId: TreeNodeId): Array<IndexedTreeNode<TData>>;
  getDescendants(
    nodeId: TreeNodeId,
    options?: TreeFlattenOptions,
  ): Array<IndexedTreeNode<TData>>;
  getNodeById(nodeId: TreeNodeId): IndexedTreeNode<TData> | null;
  getPath(nodeId: TreeNodeId): Array<IndexedTreeNode<TData>>;
  getSubtree(nodeId: TreeNodeId): IndexedTreeNode<TData> | null;
  nodes: Array<IndexedTreeNode<TData>>;
  roots: Array<IndexedTreeNode<TData>>;
};

export type TreeStats = {
  leafCount: number;
  maxDepth: number;
  nodeCount: number;
  rootCount: number;
};

export type TreeChildrenSelector<TNode> = (node: TNode) => readonly TNode[];

export function createTreeIndex<TData = Record<string, unknown>>(
  nodes: readonly FlatTreeNode<TData>[],
  options: TreeIndexOptions<TData> = {},
): TreeIndex<TData> {
  const indexedNodes = nodes.map((node, index) => normalizeTreeNode(node, index));
  const nodeLookup = createNodeLookup(indexedNodes);

  normalizeParentReferences(
    indexedNodes,
    nodeLookup,
    options.missingParent ?? "root",
  );
  assertTreeIsAcyclic(indexedNodes, nodeLookup);

  const roots = attachChildren(indexedNodes, nodeLookup);

  if (options.sortSiblings) {
    sortTreeSiblings(roots, options.sortSiblings);
  }

  assignTreePositions(roots);

  return {
    flatten(flattenOptions) {
      return flattenTree(roots, flattenOptions);
    },

    getAncestors(nodeId) {
      const node = nodeLookup.get(String(nodeId));
      const ancestors: Array<IndexedTreeNode<TData>> = [];
      let parent = node?.parentId ? nodeLookup.get(node.parentId) : undefined;

      while (parent) {
        ancestors.unshift(parent);
        parent = parent.parentId ? nodeLookup.get(parent.parentId) : undefined;
      }

      return ancestors;
    },

    getChildren(nodeId) {
      return [...(nodeLookup.get(String(nodeId))?.children ?? [])];
    },

    getDescendants(nodeId, flattenOptions) {
      const node = nodeLookup.get(String(nodeId));

      return node ? flattenTree(node.children, flattenOptions) : [];
    },

    getNodeById(nodeId) {
      return nodeLookup.get(String(nodeId)) ?? null;
    },

    getPath(nodeId) {
      const node = nodeLookup.get(String(nodeId));

      return node ? node.path.map((pathId) => nodeLookup.get(pathId)!) : [];
    },

    getSubtree(nodeId) {
      return nodeLookup.get(String(nodeId)) ?? null;
    },

    nodes: indexedNodes,
    roots,
  };
}

export function flattenTree<TNode>(
  roots: readonly TNode[],
  options: TreeFlattenOptions & {
    getChildren?: TreeChildrenSelector<TNode>;
  } = {},
): TNode[] {
  const getChildren = options.getChildren ?? getDefaultChildren;
  const order = options.order ?? "preorder";

  if (order === "breadth-first") {
    return flattenBreadthFirst(roots, getChildren);
  }

  const flattened: TNode[] = [];

  for (const root of roots) {
    flattenDepthFirst(root, getChildren, order, flattened);
  }

  return flattened;
}

export function getTreeStats<TNode>(
  roots: readonly TNode[],
  options: {
    getChildren?: TreeChildrenSelector<TNode>;
  } = {},
): TreeStats {
  const getChildren = options.getChildren ?? getDefaultChildren;
  let leafCount = 0;
  let maxDepth = 0;
  let nodeCount = 0;

  const queue = roots.map((node) => ({ depth: 0, node }));

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const { depth, node } = queue[cursor]!;
    const children = getChildren(node);

    nodeCount += 1;
    maxDepth = Math.max(maxDepth, depth);

    if (children.length === 0) {
      leafCount += 1;
      continue;
    }

    queue.push(...children.map((child) => ({ depth: depth + 1, node: child })));
  }

  return {
    leafCount,
    maxDepth,
    nodeCount,
    rootCount: roots.length,
  };
}

function normalizeTreeNode<TData>(
  node: FlatTreeNode<TData>,
  index: number,
): IndexedTreeNode<TData> {
  return {
    children: [],
    data: node.data ?? ({} as TData),
    depth: 0,
    id: String(node.id),
    index,
    label: node.label ?? "",
    parentId:
      node.parentId === undefined || node.parentId === null
        ? null
        : String(node.parentId),
    path: [],
  };
}

function createNodeLookup<TData>(nodes: readonly IndexedTreeNode<TData>[]) {
  const nodeLookup = new Map<string, IndexedTreeNode<TData>>();

  for (const node of nodes) {
    if (nodeLookup.has(node.id)) {
      throw new Error(`Duplicate tree node id: ${node.id}`);
    }

    nodeLookup.set(node.id, node);
  }

  return nodeLookup;
}

function normalizeParentReferences<TData>(
  nodes: readonly IndexedTreeNode<TData>[],
  nodeLookup: ReadonlyMap<string, IndexedTreeNode<TData>>,
  missingParent: "error" | "root",
) {
  for (const node of nodes) {
    if (node.parentId === null) {
      continue;
    }

    if (node.parentId === node.id) {
      throw new Error(`Tree node cannot be its own parent: ${node.id}`);
    }

    if (!nodeLookup.has(node.parentId)) {
      if (missingParent === "error") {
        throw new Error(`Unknown parent tree node: ${node.parentId}`);
      }

      node.parentId = null;
    }
  }
}

function assertTreeIsAcyclic<TData>(
  nodes: readonly IndexedTreeNode<TData>[],
  nodeLookup: ReadonlyMap<string, IndexedTreeNode<TData>>,
) {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  for (const node of nodes) {
    visitParentChain(node, nodeLookup, visiting, visited);
  }
}

function visitParentChain<TData>(
  node: IndexedTreeNode<TData>,
  nodeLookup: ReadonlyMap<string, IndexedTreeNode<TData>>,
  visiting: Set<string>,
  visited: Set<string>,
) {
  if (visited.has(node.id)) {
    return;
  }

  if (visiting.has(node.id)) {
    throw new Error(`Tree contains a parent cycle involving node: ${node.id}`);
  }

  visiting.add(node.id);

  if (node.parentId) {
    visitParentChain(
      nodeLookup.get(node.parentId)!,
      nodeLookup,
      visiting,
      visited,
    );
  }

  visiting.delete(node.id);
  visited.add(node.id);
}

function attachChildren<TData>(
  nodes: readonly IndexedTreeNode<TData>[],
  nodeLookup: ReadonlyMap<string, IndexedTreeNode<TData>>,
) {
  const roots: Array<IndexedTreeNode<TData>> = [];

  for (const node of nodes) {
    node.children = [];
  }

  for (const node of nodes) {
    if (node.parentId === null) {
      roots.push(node);
      continue;
    }

    nodeLookup.get(node.parentId)!.children.push(node);
  }

  return roots;
}

function sortTreeSiblings<TData>(
  nodes: Array<IndexedTreeNode<TData>>,
  sortSiblings: (
    left: IndexedTreeNode<TData>,
    right: IndexedTreeNode<TData>,
  ) => number,
) {
  nodes.sort(sortSiblings);

  for (const node of nodes) {
    sortTreeSiblings(node.children, sortSiblings);
  }
}

function assignTreePositions<TData>(
  nodes: readonly IndexedTreeNode<TData>[],
  parentPath: readonly string[] = [],
) {
  for (const node of nodes) {
    node.path = [...parentPath, node.id];
    node.depth = parentPath.length;
    assignTreePositions(node.children, node.path);
  }
}

function flattenBreadthFirst<TNode>(
  roots: readonly TNode[],
  getChildren: TreeChildrenSelector<TNode>,
) {
  const queue = [...roots];

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    queue.push(...getChildren(queue[cursor]!));
  }

  return queue;
}

function flattenDepthFirst<TNode>(
  node: TNode,
  getChildren: TreeChildrenSelector<TNode>,
  order: Exclude<TreeTraversalOrder, "breadth-first">,
  flattened: TNode[],
) {
  if (order === "preorder") {
    flattened.push(node);
  }

  for (const child of getChildren(node)) {
    flattenDepthFirst(child, getChildren, order, flattened);
  }

  if (order === "postorder") {
    flattened.push(node);
  }
}

function getDefaultChildren<TNode>(node: TNode): readonly TNode[] {
  return (
    node &&
    typeof node === "object" &&
    "children" in node &&
    Array.isArray(node.children)
      ? node.children
      : []
  ) as readonly TNode[];
}
