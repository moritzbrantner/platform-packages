"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@moritzbrantner/ui";

import { resolveStoryPath } from "./story-path";
import { StoryMinimap } from "./story-minimap";
import { StoryProgress } from "./story-progress";
import { StoryStageFrame } from "./story-stage-frame";
import {
  getStoryChoices,
  getStoryNode,
  isStoryEnding,
  validateStory,
} from "./story-validation";
import type {
  ResolvedStoryPath,
  StoryDocument,
  StoryHistoryEntry,
  StoryNodeData,
  StoryRenderProps,
  StoryRendererRegistry,
} from "./story-model";

export type StoryScrollerProps<TData extends StoryNodeData = StoryNodeData> = {
  story: StoryDocument<TData>;
  registry?: StoryRendererRegistry<TData>;
  pathChoiceIds?: string[];
  className?: string;
  ariaLabel?: string;
};

export function StoryScroller<TData extends StoryNodeData = StoryNodeData>({
  story: input,
  registry,
  pathChoiceIds = [],
  className,
  ariaLabel,
}: StoryScrollerProps<TData>) {
  const story = useMemo(() => validateStory(input), [input]);
  const path = useMemo(
    () =>
      resolveStoryPath(story, {
        choiceIds: pathChoiceIds,
        autoAdvanceLinearNodes: true,
      }),
    [pathChoiceIds, story],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const activeNode = path.nodes[activeIndex] ?? path.currentNode;
  const history = path.history.slice(0, activeIndex + 1);
  const choices = getStoryChoices(story, activeNode);
  const progress = (activeIndex + 1) / Math.max(path.nodes.length, 1);

  const goToScene = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(index, path.nodes.length - 1)));
    },
    [path.nodes.length],
  );

  useEffect(() => {
    setActiveIndex((current) => Math.max(0, Math.min(current, path.nodes.length - 1)));
  }, [path.nodes.length]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        goToScene(activeIndex + 1);
        return;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        goToScene(activeIndex - 1);
        return;
      case "Home":
        event.preventDefault();
        goToScene(0);
        return;
      case "End":
        event.preventDefault();
        goToScene(path.nodes.length - 1);
        return;
      default:
        return;
    }
  };

  const renderPath: ResolvedStoryPath<TData> = {
    ...path,
    currentNode: activeNode,
    history,
    nodes: path.nodes.slice(0, activeIndex + 1),
    completed: isStoryEnding(story, activeNode),
  };
  const renderProps: StoryRenderProps<TData> = {
    story,
    node: activeNode,
    history,
    path: renderPath,
    currentIndex: activeIndex,
    progress,
    isEnding: isStoryEnding(story, activeNode),
    canGoBack: activeIndex > 0,
    choices,
    choose: () => {},
    goBack: () => goToScene(activeIndex - 1),
    restart: () => goToScene(0),
  };

  return (
    <section
      role="region"
      aria-label={ariaLabel ?? story.labels?.scrollerLabel ?? story.title}
      className={cn("rounded-lg border bg-card p-4 md:p-6", className)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="grid gap-5 lg:grid-cols-[14rem_1fr]">
        <StoryMinimap
          items={path.nodes.map((node) => ({
            id: node.id,
            title: node.title,
            eyebrow: node.eyebrow,
          }))}
          activeIndex={activeIndex}
          onSelect={goToScene}
          ariaLabel={story.labels?.minimapLabel}
        />

        <div ref={viewportRef} className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeNode.id}
              initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: reducedMotion ? 0 : 0.25, ease: "easeOut" }}
            >
              <StoryStageFrame {...renderProps} registry={registry} />
            </motion.div>
          </AnimatePresence>
          <StoryProgress
            className="mt-5"
            value={progress}
            label={`Scene ${activeIndex + 1} / ${path.nodes.length}`}
          />
        </div>
      </div>
    </section>
  );
}
