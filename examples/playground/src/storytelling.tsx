import {
  startTransition,
  useState,
  type ComponentType,
} from "react";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@moritzbrantner/ui";
import {
  InteractiveStoryPlayer,
  StoryDefaultStage,
  buildStoryTimeline,
  createInteractiveStory,
  type StoryRenderProps,
} from "@moritzbrantner/storytelling";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

type StoryVisualData = {
  hue: number;
  orbitSpeed: number;
};

const story = createInteractiveStory<StoryVisualData>({
  id: "aurora-station",
  title: "Aurora Station",
  subtitle:
    "Branching story runtime with motion.dev transitions, optional Three.js stages, and Remotion-compatible path planning.",
  openingNodeId: "signal",
  nodes: [
    {
      id: "signal",
      eyebrow: "Chapter 1",
      title: "A pulse reaches the observatory",
      body: (
        <>
          <p>
            The station wakes to a rhythmic beacon under the ice shelf. The archive says
            these pulses stopped two centuries ago.
          </p>
          <p>
            You need a first move: answer the call, trace its source, or seal the relay and
            protect the city above.
          </p>
        </>
      ),
      prompt: "Choose the branch to follow.",
      data: { hue: 196, orbitSpeed: 0.8 },
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
      body: (
        <>
          <p>
            The pilot’s voice breaks through static: the old trade route is alive again, but
            the storm is moving too fast for a slow evacuation.
          </p>
          <p>
            You can guide them into the city or reroute them through the abandoned turbines.
          </p>
        </>
      ),
      prompt: "Where do you send the pilot?",
      data: { hue: 334, orbitSpeed: 1.15 },
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
      body: (
        <>
          <p>
            The pulses form a navigation pattern. Beneath the glacier sits a harbor nobody
            has charted since the first migration.
          </p>
          <p>
            If you descend now, you might recover the route before the city council can bury
            the evidence.
          </p>
        </>
      ),
      prompt: "How do you approach the harbor?",
      data: { hue: 145, orbitSpeed: 0.95 },
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
      body: (
        <>
          <p>
            You shut the relay down. The city is safe for one more night, but the signal
            keeps echoing through backup systems you forgot still existed.
          </p>
          <p>
            By morning, someone else will find it without you.
          </p>
        </>
      ),
      prompt: "This branch ends in control without truth.",
      data: { hue: 42, orbitSpeed: 0.55 },
      durationInFrames: 180,
    },
    {
      id: "city-ending",
      eyebrow: "Ending",
      title: "The city opens its gates",
      body: "You turn a hidden route into a public alliance. The station survives because you chose contact over caution.",
      data: { hue: 210, orbitSpeed: 1.1 },
      durationInFrames: 180,
    },
    {
      id: "turbine-ending",
      eyebrow: "Ending",
      title: "The turbines become a corridor",
      body: "You keep the pilot alive and the city uninformed. The route is saved, but now it belongs to the people who know how to hide it.",
      data: { hue: 286, orbitSpeed: 0.9 },
      durationInFrames: 180,
    },
    {
      id: "harbor-ending",
      eyebrow: "Ending",
      title: "You reach the harbor first",
      body: "The descent uncovers intact ships and a map of every lost crossing. The story shifts from rumor to leverage.",
      data: { hue: 170, orbitSpeed: 1.25 },
      durationInFrames: 180,
    },
    {
      id: "broadcast-ending",
      eyebrow: "Ending",
      title: "The whole city hears the coordinates",
      body: "You give up secrecy and gain momentum. By sunrise, nobody can pretend the harbor never existed.",
      data: { hue: 18, orbitSpeed: 1.05 },
      durationInFrames: 180,
    },
  ],
});

const cinematicPath = buildStoryTimeline(story, ["trace", "dive"]);

function StorytellingPage() {
  const [ThreeStageRenderer, setThreeStageRenderer] =
    useState<ComponentType<StoryRenderProps<StoryVisualData>> | null>(null);
  const [useThreeStage, setUseThreeStage] = useState(false);
  const [isLoadingThreeStage, setIsLoadingThreeStage] = useState(false);

  const loadThreeStage = async () => {
    if (ThreeStageRenderer || isLoadingThreeStage) {
      return;
    }

    setIsLoadingThreeStage(true);

    try {
      const module = await import("./storytelling-three-stage");

      startTransition(() => {
        setThreeStageRenderer(() => module.StoryThreeStageRenderer);
        setIsLoadingThreeStage(false);
      });
    } catch {
      setIsLoadingThreeStage(false);
    }
  };

  const enableThreeStage = async () => {
    await loadThreeStage();
    setUseThreeStage(true);
  };

  const activeStageRenderer =
    useThreeStage && ThreeStageRenderer ? ThreeStageRenderer : StoryDefaultStage;

  return (
    <PlaygroundPage
      activePage="storytelling"
      title="Storytelling package examples"
      description="Interactive branching narrative primitives with motion.dev transitions, Remotion timeline helpers, and an optional Three.js stage renderer."
    >
      <section className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-5">
          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                Package scope
              </Badge>
              <CardTitle>What this demo validates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>Choice-driven story graph with branching nodes and restart/back controls.</p>
              <p>Motion.dev-powered transitions in the player while the active node changes.</p>
              <p>Three.js is opt-in, so the story page stays on the lightweight 2D stage unless the user explicitly enables cinematic mode.</p>
              <p>Remotion path planning stays available from the same story data model.</p>
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
                    void enableThreeStage();
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setUseThreeStage(false);
                    }}
                  >
                    Back to 2D
                  </Button>
                ) : null}
              </div>
              <Button asChild variant="outline">
                <a href="/ui.html">Compare with UI package page</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                Remotion helper
              </Badge>
              <CardTitle>Cinematic branch metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                The branch <code>signal -&gt; harbor -&gt; harbor-ending</code> produces{" "}
                <strong className="text-foreground">{cinematicPath.totalFrames}</strong> frames
                across <strong className="text-foreground">{cinematicPath.scenes.length}</strong>{" "}
                scenes.
              </p>
              <p>
                Use <code>@moritzbrantner/storytelling/remotion</code> when you want to render a
                chosen path into a video composition.
              </p>
            </CardContent>
          </Card>
        </div>

        <InteractiveStoryPlayer story={story} stageRenderer={activeStageRenderer} />
      </section>
    </PlaygroundPage>
  );
}

mountPage(<StorytellingPage />);
