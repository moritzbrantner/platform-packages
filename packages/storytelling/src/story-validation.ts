import type { StoryChoice, StoryDocument, StoryNode, StoryNodeData } from "./story-model";

const isDevelopment = process.env.NODE_ENV !== "production";

function invariant(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export function createStoryNodeLookup<TData extends StoryNodeData>(story: StoryDocument<TData>) {
  return new Map(story.nodes.map((node) => [node.id, node] as const));
}

export function getStoryNode<TData extends StoryNodeData>(
  story: StoryDocument<TData>,
  nodeId: string,
) {
  const node = createStoryNodeLookup(story).get(nodeId);

  if (!node) {
    throw new Error(`Story "${story.id}" does not contain node "${nodeId}".`);
  }

  return node;
}

export function getStoryChoices<TData extends StoryNodeData>(
  story: StoryDocument<TData>,
  node: StoryNode<TData>,
): StoryChoice[] {
  if (node.choices && node.choices.length > 0) {
    return node.choices;
  }

  if (!node.next) {
    return [];
  }

  return [
    {
      id: `${node.id}__continue`,
      label: story.labels?.continue ?? "Continue",
      target: node.next,
    },
  ];
}

export function isStoryEnding<TData extends StoryNodeData>(
  story: StoryDocument<TData>,
  node: StoryNode<TData>,
) {
  return getStoryChoices(story, node).length === 0;
}

export function validateStory<TData extends StoryNodeData>(story: StoryDocument<TData>) {
  invariant(story.id.length > 0, "Story id must be non-empty.");
  invariant(story.title.length > 0, `Story "${story.id}" must have a title.`);
  invariant(story.nodes.length > 0, `Story "${story.id}" must declare at least one node.`);

  const nodeIds = new Set<string>();

  for (const node of story.nodes) {
    invariant(node.id.length > 0, "Story nodes must have a non-empty id.");
    invariant(
      !nodeIds.has(node.id),
      `Story node ids must be unique. Duplicate id "${node.id}" found.`,
    );
    invariant(node.title.length > 0, `Story node "${node.id}" must have a title.`);
    nodeIds.add(node.id);

    const choiceIds = new Set<string>();
    for (const choice of node.choices ?? []) {
      invariant(choice.id.length > 0, `Choice ids must be non-empty on node "${node.id}".`);
      invariant(
        !choiceIds.has(choice.id),
        `Choice ids must be unique per node. Duplicate choice "${choice.id}" found on "${node.id}".`,
      );
      invariant(
        choice.label.length > 0,
        `Choice "${choice.id}" on "${node.id}" must have a label.`,
      );
      choiceIds.add(choice.id);
    }
  }

  invariant(
    nodeIds.has(story.openingNodeId),
    `Story "${story.id}" references missing opening node "${story.openingNodeId}".`,
  );

  for (const node of story.nodes) {
    for (const choice of node.choices ?? []) {
      invariant(
        nodeIds.has(choice.target),
        `Choice "${choice.id}" on "${node.id}" points to missing node "${choice.target}".`,
      );
    }

    if (node.next) {
      invariant(
        nodeIds.has(node.next),
        `Node "${node.id}" points to missing next node "${node.next}".`,
      );
    }
  }

  detectStoryGraphCycle(story);

  return story;
}

export function defineStory<TData extends StoryNodeData>(story: StoryDocument<TData>) {
  return validateStory(story);
}

function detectStoryGraphCycle<TData extends StoryNodeData>(story: StoryDocument<TData>) {
  const nodeLookup = createStoryNodeLookup(story);
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (nodeId: string, trail: string[]) => {
    if (visited.has(nodeId)) return;
    if (visiting.has(nodeId)) {
      throw new Error(`Story "${story.id}" contains a cycle: ${[...trail, nodeId].join(" -> ")}.`);
    }

    const node = nodeLookup.get(nodeId);
    if (!node) {
      visited.add(nodeId);
      return;
    }

    visiting.add(nodeId);

    for (const choice of node.choices ?? []) {
      visit(choice.target, [...trail, nodeId]);
    }

    if (node.next) {
      visit(node.next, [...trail, nodeId]);
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  for (const node of story.nodes) {
    visit(node.id, []);
  }
}

export function maybeValidateStory<TData extends StoryNodeData>(story: StoryDocument<TData>) {
  if (isDevelopment) {
    validateStory(story);
  }

  return story;
}
