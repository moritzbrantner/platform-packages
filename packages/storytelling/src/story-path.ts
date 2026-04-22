import type {
  ResolvedStoryPath,
  StoryDocument,
  StoryHistoryEntry,
  StoryNode,
  StoryNodeData,
  StoryTimeline,
  StoryTimelineScene,
} from "./story-model";
import { createStoryNodeLookup, getStoryChoices, maybeValidateStory } from "./story-validation";

const DEFAULT_DURATION_IN_FRAMES = 120;
const DEFAULT_TRANSITION_IN_FRAMES = 18;
const DEFAULT_FPS = 30;

export type ResolveStoryPathOptions = {
  choiceIds?: string[];
  autoAdvanceLinearNodes?: boolean;
  stopAt?: string;
  maxSteps?: number;
};

export type BuildStoryTimelineOptions = {
  choiceIds?: string[];
  fps?: number;
  defaultDurationInFrames?: number;
  transitionInFrames?: number;
};

export function resolveStoryPath<TData extends StoryNodeData>(
  input: StoryDocument<TData>,
  options: ResolveStoryPathOptions = {},
): ResolvedStoryPath<TData> {
  const story = maybeValidateStory(input);
  const nodeLookup = createStoryNodeLookup(story);
  const nodes: StoryNode<TData>[] = [];
  const history: StoryHistoryEntry<TData>[] = [];
  const choiceIds = options.choiceIds ?? [];
  const autoAdvanceLinearNodes = options.autoAdvanceLinearNodes ?? false;
  const maxSteps = options.maxSteps ?? story.nodes.length * 2;
  let currentNode = nodeLookup.get(story.openingNodeId)!;
  let choiceIndex = 0;

  nodes.push(currentNode);
  history.push({ nodeId: currentNode.id, data: currentNode.data });

  for (let step = 0; step < maxSteps; step += 1) {
    if (options.stopAt && currentNode.id === options.stopAt) {
      return {
        nodes,
        history,
        currentNode,
        completed: true,
        stoppedAt: options.stopAt,
      };
    }

    const choices = getStoryChoices(story, currentNode);
    if (choices.length === 0) {
      return {
        nodes,
        history,
        currentNode,
        completed: true,
      };
    }

    let selectedChoice = choiceIds[choiceIndex]
      ? choices.find((choice) => choice.id === choiceIds[choiceIndex] && !choice.disabled)
      : undefined;

    if (!selectedChoice && autoAdvanceLinearNodes && !currentNode.choices?.length) {
      selectedChoice = choices.find((choice) => !choice.disabled);
    }

    if (!selectedChoice) {
      return {
        nodes,
        history,
        currentNode,
        completed: false,
      };
    }

    if (choiceIds[choiceIndex] === selectedChoice.id) {
      choiceIndex += 1;
    }

    const nextNode = nodeLookup.get(selectedChoice.target);
    if (!nextNode) {
      return {
        nodes,
        history,
        currentNode,
        completed: false,
      };
    }

    currentNode = nextNode;
    nodes.push(nextNode);
    history.push({
      nodeId: nextNode.id,
      choiceId: selectedChoice.id,
      data: nextNode.data,
    });
  }

  throw new Error(`Story "${story.id}" exceeded ${maxSteps} steps while resolving a path.`);
}

export function buildStoryTimeline<TData extends StoryNodeData>(
  story: StoryDocument<TData>,
  options: BuildStoryTimelineOptions = {},
): StoryTimeline<TData> {
  const path = resolveStoryPath(story, {
    choiceIds: options.choiceIds,
    autoAdvanceLinearNodes: true,
  });
  const fps = options.fps ?? DEFAULT_FPS;
  const defaultDurationInFrames =
    options.defaultDurationInFrames ??
    story.defaults?.durationInFrames ??
    DEFAULT_DURATION_IN_FRAMES;
  const defaultTransitionInFrames =
    options.transitionInFrames ??
    story.defaults?.transitionInFrames ??
    DEFAULT_TRANSITION_IN_FRAMES;
  let cursor = 0;

  const scenes: StoryTimelineScene<TData>[] = path.nodes.map((node, index) => {
    const durationInFrames = node.durationInFrames ?? defaultDurationInFrames;
    const transitionInFrames = node.transition?.durationInFrames ?? defaultTransitionInFrames;
    const scene = {
      node,
      startFrame: cursor,
      durationInFrames,
      endFrame: cursor + durationInFrames,
      transitionInFrames,
      pathIndex: index,
      history: path.history.slice(0, index + 1),
    };

    cursor = scene.endFrame;
    return scene;
  });

  return {
    scenes,
    totalFrames: cursor,
    fps,
    history: path.history,
  };
}
