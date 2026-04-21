import { startTransition, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@moritzbrantner/ui";
import {
  StoryPlayer,
  StoryScroller,
  buildStoryTimeline,
  createStoryRendererRegistry,
  defineStory,
  type StoryDocument,
  type StoryRendererRegistry,
} from "@moritzbrantner/storytelling";
import { getStoryCompositionProps } from "@moritzbrantner/storytelling/remotion";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

type StoryVisualData = {
  hue: number;
  orbitSpeed: number;
};

const story = defineStory<StoryVisualData>({
  id: "aurora-station",
  title: "Aurora Station",
  subtitle:
    "A unified story document rendered as an interactive branch, a scroll preview, and Remotion composition metadata.",
  description:
    "Branching storytelling primitives with registry-based renderers for web, Three.js, and Remotion.",
  openingNodeId: "signal",
  defaults: {
    durationInFrames: 120,
    transitionInFrames: 18,
    stage: { renderer: "default" },
  },
  labels: {
    choosePrompt: "Choose the branch to follow.",
    completedBranch: "Restart to explore another branch, or go back to revise the path.",
  },
  nodes: [
    {
      id: "signal",
      eyebrow: "Chapter 1",
      title: "A pulse reaches the observatory",
      content: [
        {
          type: "paragraph",
          text: "The station wakes to a rhythmic beacon under the ice shelf. The archive says these pulses stopped two centuries ago.",
        },
        {
          type: "paragraph",
          text: "You need a first move: answer the call, trace its source, or seal the relay and protect the city above.",
        },
      ],
      prompt: "Choose the branch to follow.",
      data: { hue: 196, orbitSpeed: 0.8 },
      stage: {
        renderer: "beacon",
        props: { ringColor: "#bfdbfe", accent: "#0ea5e9" },
      },
      choices: [
        {
          id: "answer",
          label: "Answer the beacon",
          description: "Open a live channel and risk exposing the station.",
          target: "voice",
        },
        {
          id: "trace",
          label: "Trace the source",
          description: "Map the signal geometry before anyone else notices it.",
          target: "harbor",
        },
        {
          id: "seal",
          label: "Seal the relay",
          description: "Lock the channel down and preserve control at all costs.",
          target: "blackout",
        },
      ],
    },
    {
      id: "voice",
      eyebrow: "Branch A",
      title: "A pilot answers from the storm wall",
      content: [
        {
          type: "paragraph",
          text: "The pilot's voice breaks through static: the old trade route is alive again, but the storm is moving too fast for a slow evacuation.",
        },
        {
          type: "paragraph",
          text: "You can guide them into the city or reroute them through the abandoned turbines.",
        },
      ],
      prompt: "Where do you send the pilot?",
      data: { hue: 334, orbitSpeed: 1.15 },
      stage: {
        renderer: "beacon",
        props: { ringColor: "#fbcfe8", accent: "#db2777" },
      },
      choices: [
        {
          id: "city",
          label: "Guide them into the city",
          description: "Fastest path, highest political cost.",
          target: "city-ending",
        },
        {
          id: "turbines",
          label: "Reroute through the turbines",
          description: "Slower, but harder for patrols to detect.",
          target: "turbine-ending",
        },
      ],
    },
    {
      id: "harbor",
      eyebrow: "Branch B",
      title: "The trace reveals a submerged harbor",
      content: [
        {
          type: "paragraph",
          text: "The pulses form a navigation pattern. Beneath the glacier sits a harbor nobody has charted since the first migration.",
        },
        {
          type: "paragraph",
          text: "If you descend now, you might recover the route before the city council can bury the evidence.",
        },
      ],
      prompt: "How do you approach the harbor?",
      data: { hue: 145, orbitSpeed: 0.95 },
      stage: {
        renderer: "beacon",
        props: { ringColor: "#bbf7d0", accent: "#059669" },
      },
      choices: [
        {
          id: "dive",
          label: "Descend with a small crew",
          description: "Quiet, fast, and dangerous.",
          target: "harbor-ending",
        },
        {
          id: "broadcast",
          label: "Broadcast the coordinates",
          description: "Force the city to respond in public.",
          target: "broadcast-ending",
        },
      ],
    },
    {
      id: "blackout",
      eyebrow: "Branch C",
      title: "The station goes dark",
      content: [
        {
          type: "paragraph",
          text: "You shut the relay down. The city is safe for one more night, but the signal keeps echoing through backup systems you forgot still existed.",
        },
        {
          type: "quote",
          text: "By morning, someone else will find it without you.",
        },
      ],
      data: { hue: 42, orbitSpeed: 0.55 },
      durationInFrames: 180,
      stage: { renderer: "default", props: { accent: "#ca8a04" } },
    },
    {
      id: "city-ending",
      eyebrow: "Ending",
      title: "The city opens its gates",
      content: [
        {
          type: "paragraph",
          text: "You turn a hidden route into a public alliance. The station survives because you chose contact over caution.",
        },
      ],
      data: { hue: 210, orbitSpeed: 1.1 },
      durationInFrames: 180,
      stage: { renderer: "default", props: { accent: "#2563eb" } },
    },
    {
      id: "turbine-ending",
      eyebrow: "Ending",
      title: "The turbines become a corridor",
      content: [
        {
          type: "paragraph",
          text: "You keep the pilot alive and the city uninformed. The route is saved, but now it belongs to the people who know how to hide it.",
        },
      ],
      data: { hue: 286, orbitSpeed: 0.9 },
      durationInFrames: 180,
      stage: { renderer: "default", props: { accent: "#7c3aed" } },
    },
    {
      id: "harbor-ending",
      eyebrow: "Ending",
      title: "You reach the harbor first",
      content: [
        {
          type: "paragraph",
          text: "The descent uncovers intact ships and a map of every lost crossing. The story shifts from rumor to leverage.",
        },
      ],
      data: { hue: 170, orbitSpeed: 1.25 },
      durationInFrames: 180,
      stage: { renderer: "default", props: { accent: "#0f766e" } },
    },
    {
      id: "broadcast-ending",
      eyebrow: "Ending",
      title: "The whole city hears the coordinates",
      content: [
        {
          type: "paragraph",
          text: "You give up secrecy and gain momentum. By sunrise, nobody can pretend the harbor never existed.",
        },
      ],
      data: { hue: 18, orbitSpeed: 1.05 },
      durationInFrames: 180,
      stage: { renderer: "default", props: { accent: "#ea580c" } },
    },
  ],
});

const cinematicChoiceIds = ["trace", "dive"];
const fallbackRegistry = createStoryRendererRegistry<StoryVisualData>();

function StorytellingPage() {
  const [registry, setRegistry] =
    useState<StoryRendererRegistry<StoryVisualData>>(fallbackRegistry);
  const [useThreeStage, setUseThreeStage] = useState(false);
  const [isLoadingThreeStage, setIsLoadingThreeStage] = useState(false);
  const timeline = useMemo(
    () => buildStoryTimeline(story, { choiceIds: cinematicChoiceIds }),
    [],
  );
  const composition = useMemo(
    () =>
      getStoryCompositionProps(story, {
        id: "aurora-station-trace",
        choiceIds: cinematicChoiceIds,
        fps: 30,
        width: 1920,
        height: 1080,
      }),
    [],
  );

  const loadThreeStage = async () => {
    if (useThreeStage || isLoadingThreeStage) return;

    setIsLoadingThreeStage(true);

    try {
      const module = await import("./storytelling-three-stage");

      startTransition(() => {
        setRegistry(module.beaconStoryRegistry);
        setUseThreeStage(true);
        setIsLoadingThreeStage(false);
      });
    } catch {
      setIsLoadingThreeStage(false);
    }
  };

  const disableThreeStage = () => {
    setRegistry(fallbackRegistry);
    setUseThreeStage(false);
  };

  return (
    <PlaygroundPage
      activePage="storytelling"
      title="Storytelling package examples"
      description="One typed story document powering branching playback, scroll previews, registry renderers, and Remotion metadata."
    >
      <section className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-5">
          <Card className="rounded-lg border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="secondary" className="w-fit rounded-md px-3 py-1">
                Unified model
              </Badge>
              <CardTitle>Reusable story document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>
                The same serializable <code>StoryDocument</code> drives interactive choices,
                scroll preview, and Remotion composition metadata.
              </p>
              <p>
                Custom stage renderers are supplied through a registry, so story data stays
                portable.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant={useThreeStage ? "secondary" : "default"}
                  onMouseEnter={() => {
                    void loadThreeStage();
                  }}
                  onFocus={() => {
                    void loadThreeStage();
                  }}
                  onClick={() => {
                    void loadThreeStage();
                  }}
                  disabled={isLoadingThreeStage}
                >
                  {isLoadingThreeStage
                    ? "Loading 3D stage"
                    : useThreeStage
                      ? "3D stage enabled"
                      : "Enable 3D stage"}
                </Button>
                {useThreeStage ? (
                  <Button type="button" variant="outline" onClick={disableThreeStage}>
                    Back to 2D
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="secondary" className="w-fit rounded-md px-3 py-1">
                Remotion
              </Badge>
              <CardTitle>Composition metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                The cinematic path has{" "}
                <strong className="text-foreground">{timeline.totalFrames}</strong> frames
                across <strong className="text-foreground">{timeline.scenes.length}</strong>{" "}
                scenes.
              </p>
              <p>
                <code>{composition.id}</code> renders at{" "}
                <strong className="text-foreground">{composition.width}x{composition.height}</strong>{" "}
                and <strong className="text-foreground">{composition.fps}</strong> fps.
              </p>
            </CardContent>
          </Card>
        </div>

        <StoryPlayer story={story} registry={registry} />
      </section>

      <section className="mt-5">
        <StoryScroller
          story={story as StoryDocument<StoryVisualData>}
          registry={registry}
          pathChoiceIds={cinematicChoiceIds}
          ariaLabel="Cinematic path preview"
        />
      </section>
    </PlaygroundPage>
  );
}

mountPage(<StorytellingPage />);
