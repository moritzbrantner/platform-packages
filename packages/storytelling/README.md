# @moritzbrantner/storytelling

Serializable story documents, branching React playback, and Remotion or
Three-friendly rendering helpers.

## Main APIs

- `defineStory(story)` / `validateStory(story)`
- `resolveStoryPath(story, options)` / `buildStoryTimeline(story, options)`
- `StoryPlayer`, `StoryControls`, `StoryScroller`, `StoryProgress`, and `StoryMinimap`
- `createStoryRendererRegistry(...)`, `getStoryRendererKey(...)`, and `getStoryStageProps(...)`
- `@moritzbrantner/storytelling/remotion` for frame-synced compositions
- `@moritzbrantner/storytelling/three` for Three.js stage rendering

## Story schema

Stories are serializable documents. Nodes can be linear with `next`, branching
with `choices`, or terminal when neither is present.

```ts
import { defineStory } from "@moritzbrantner/storytelling";

export const story = defineStory({
  id: "signal",
  title: "Signal",
  openingNodeId: "wake",
  nodes: [
    {
      id: "wake",
      title: "Wake the observatory",
      content: [{ type: "paragraph", text: "A signal reaches the tower." }],
      choices: [
        { id: "answer", label: "Answer", target: "answer-node" },
        { id: "trace", label: "Trace", target: "trace-node" },
      ],
    },
    {
      id: "answer-node",
      title: "The pilot responds",
      next: "ending",
    },
    {
      id: "trace-node",
      title: "The harbor appears",
      stage: { renderer: "map" },
    },
    {
      id: "ending",
      title: "Contact",
    },
  ],
});
```

`validateStory()` rejects duplicate node ids, duplicate choice ids, missing
targets, missing opening nodes, and cycles. `resolveStoryPath()` returns the
current path for a set of selected choice ids, while `buildStoryTimeline()`
converts that path into frame ranges for video-oriented renderers.

## React playback

Use `StoryPlayer` for focused choice-driven playback, or `StoryScroller` when
the reader should move through a progressively revealed story graph.

```tsx
import { StoryPlayer } from "@moritzbrantner/storytelling";

export function StoryExperience() {
  return <StoryPlayer story={story} />;
}
```

## Renderer registry

Renderer registries let the same story document target web, Remotion, and Three
renderers without putting renderer-specific components into the document.

```tsx
import { createStoryRendererRegistry, StoryStageFrame } from "@moritzbrantner/storytelling";

const registry = createStoryRendererRegistry({
  web: {
    map(props) {
      return <div>{props.node.title}</div>;
    },
  },
});
```

## Remotion

The Remotion entrypoint stays behind a subpath so base React consumers do not
need to load Remotion code.

```tsx
import { StoryRemotionComposition } from "@moritzbrantner/storytelling/remotion";

export function VideoStory() {
  return <StoryRemotionComposition story={story} choiceIds={["answer"]} />;
}
```

## Three

The Three entrypoint follows the same pattern and expects `three` and
`@react-three/fiber` as peer dependencies.

```tsx
import { StoryCanvasStage } from "@moritzbrantner/storytelling/three";

export function ThreeStory() {
  return <StoryCanvasStage story={story} choiceIds={["trace"]} />;
}
```

## Adapter decision

The React package keeps `./remotion` and `./three` as subpath exports for now.
Do not split them into separate packages until the base story schema and renderer
registry stabilize and a downstream consumer needs independent adapter release
cadence.

## Split-readiness checklist

This package remains in the monorepo until its public API has enough docs,
tests, and consumer smoke coverage for standalone release. Before moving it:

```sh
bun run --filter @moritzbrantner/storytelling verify:release
```

The release gate covers type checking, import linting, unit tests, build,
package export smoke tests, and package dry-run contents.
