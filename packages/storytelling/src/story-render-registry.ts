import type { StoryNode, StoryNodeData, StoryRendererRegistry } from "./story-model";

export function createStoryRendererRegistry<
  TData extends StoryNodeData = StoryNodeData,
>(registry: StoryRendererRegistry<TData> = {}) {
  return registry;
}

export function getStoryRendererKey<TData extends StoryNodeData>(
  node: StoryNode<TData>,
) {
  return node.stage?.renderer ?? node.stage?.variant ?? "default";
}

export function getStoryStageProps<TData extends StoryNodeData>(
  node: StoryNode<TData>,
) {
  return node.stage?.props ?? {};
}
