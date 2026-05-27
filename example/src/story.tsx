import {
  StoryContent,
  createStoryRendererRegistry,
  defineStory,
  type StoryRenderProps,
} from "@moritzbrantner/storytelling";

export type SignalStoryData = {
  channel: string;
  imageAlt: string;
  imageSrc: string;
  intensity: number;
  location: string;
  metricLabel: string;
  metricValue: string;
  tone: "amber" | "cyan" | "green" | "rose";
};

export const signalStory = defineStory<SignalStoryData>({
  id: "observatory-relay",
  title: "Observatory Relay",
  subtitle: "A branching signal story",
  openingNodeId: "wake",
  labels: {
    choosePrompt: "Choose the next move.",
    completedBranch: "This branch is complete.",
    continue: "Continue",
    restart: "Restart",
    scrollerLabel: "Observatory Relay scroller",
  },
  defaults: {
    durationInFrames: 120,
    transitionInFrames: 16,
  },
  nodes: [
    {
      id: "wake",
      title: "Wake the observatory",
      eyebrow: "Incoming",
      prompt: "Route the signal.",
      stage: { renderer: "signal-stage" },
      data: {
        channel: "L-14",
        imageAlt: "A mountain observatory under a star field",
        imageSrc:
          "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&q=80",
        intensity: 72,
        location: "North Ridge Array",
        metricLabel: "Signal lock",
        metricValue: "72%",
        tone: "cyan",
      },
      content: [
        {
          type: "paragraph",
          text: "The midnight receiver catches a repeating pulse under the weather band.",
        },
        {
          type: "list",
          items: ["Three clean repeats", "Weak carrier drift", "No registered flight plan"],
        },
      ],
      choices: [
        {
          id: "answer",
          label: "Answer the pulse",
          description: "Open a voice channel before the signal fades.",
          target: "pilot",
        },
        {
          id: "trace",
          label: "Trace the source",
          description: "Hold transmission and triangulate the coordinates.",
          target: "harbor",
        },
        {
          id: "archive",
          label: "Check the archive",
          description: "Compare the pattern against old expedition logs.",
          target: "archive",
        },
      ],
    },
    {
      id: "pilot",
      title: "A pilot breaks through",
      eyebrow: "Voice",
      prompt: "Keep the pilot talking.",
      next: "runway",
      stage: { renderer: "signal-stage" },
      data: {
        channel: "VHF 9",
        imageAlt: "A cockpit view over clouds at sunrise",
        imageSrc:
          "https://images.unsplash.com/photo-1474302770737-173ee21bab63?auto=format&fit=crop&w=1400&q=80",
        intensity: 88,
        location: "Cloud deck east",
        metricLabel: "Voice clarity",
        metricValue: "88%",
        tone: "amber",
      },
      content: [
        {
          type: "quote",
          text: "Relay tower, this is Kestrel Nine. I have lights below me where the chart shows water.",
          cite: "Kestrel Nine",
        },
        {
          type: "paragraph",
          text: "The pilot's transponder appears for one sweep, then drops behind a wall of static.",
        },
      ],
    },
    {
      id: "runway",
      title: "Lights align on the ridge",
      eyebrow: "Approach",
      stage: { renderer: "signal-stage" },
      data: {
        channel: "ILS ghost",
        imageAlt: "Runway lights cutting through fog at night",
        imageSrc:
          "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=1400&q=80",
        intensity: 96,
        location: "Ridge line",
        metricLabel: "Approach fix",
        metricValue: "Locked",
        tone: "green",
      },
      content: [
        {
          type: "paragraph",
          text: "The array paints a landing path across ground that should be empty rock.",
        },
        {
          type: "heading",
          text: "The pilot has a corridor.",
        },
      ],
    },
    {
      id: "harbor",
      title: "The map reveals a hidden harbor",
      eyebrow: "Triangulated",
      prompt: "Choose what to do with the coordinates.",
      stage: { renderer: "signal-stage" },
      data: {
        channel: "Bearing 032",
        imageAlt: "A sheltered harbor bordered by dark cliffs",
        imageSrc:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
        intensity: 64,
        location: "Unmarked inlet",
        metricLabel: "Coordinate fit",
        metricValue: "64%",
        tone: "green",
      },
      content: [
        {
          type: "paragraph",
          text: "The cove was removed from civilian charts after a storm changed the coastline.",
        },
      ],
      choices: [
        {
          id: "send-team",
          label: "Send a field team",
          description: "Dispatch a ground crew before weather closes in.",
          target: "field-team",
        },
        {
          id: "broadcast",
          label: "Broadcast the fix",
          description: "Share the coordinates with every receiver in range.",
          target: "broadcast",
        },
      ],
    },
    {
      id: "field-team",
      title: "The field team finds the beacon",
      eyebrow: "Recovered",
      stage: { renderer: "signal-stage" },
      data: {
        channel: "Rescue band",
        imageAlt: "A search team crossing wet ground with headlamps",
        imageSrc:
          "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80",
        intensity: 91,
        location: "Old harbor road",
        metricLabel: "Beacon range",
        metricValue: "91%",
        tone: "rose",
      },
      content: [
        {
          type: "paragraph",
          text: "Inside the beacon case is a dry logbook, still wrapped in waxed canvas.",
        },
      ],
    },
    {
      id: "broadcast",
      title: "Every receiver answers back",
      eyebrow: "Network",
      stage: { renderer: "signal-stage" },
      data: {
        channel: "Open relay",
        imageAlt: "A radio tower above a city at dusk",
        imageSrc:
          "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80",
        intensity: 99,
        location: "Regional mesh",
        metricLabel: "Relay spread",
        metricValue: "99%",
        tone: "cyan",
      },
      content: [
        {
          type: "paragraph",
          text: "The hidden harbor becomes a shared waypoint in less than a minute.",
        },
      ],
    },
    {
      id: "archive",
      title: "The archive names the pattern",
      eyebrow: "Recovered log",
      next: "archive-ending",
      stage: { renderer: "signal-stage" },
      data: {
        channel: "Tape 31B",
        imageAlt: "Shelves of archive boxes in warm light",
        imageSrc:
          "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1400&q=80",
        intensity: 58,
        location: "Basement stacks",
        metricLabel: "Pattern match",
        metricValue: "58%",
        tone: "amber",
      },
      content: [
        {
          type: "paragraph",
          text: "A survey crew logged the same pulse thirty years ago, then marked the page with one word: shelter.",
        },
      ],
    },
    {
      id: "archive-ending",
      title: "A route opens in the old log",
      eyebrow: "Shelter",
      stage: { renderer: "signal-stage" },
      data: {
        channel: "Logbook",
        imageAlt: "A marked route drawn across a paper map",
        imageSrc:
          "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1400&q=80",
        intensity: 83,
        location: "Hand-drawn chart",
        metricLabel: "Route confidence",
        metricValue: "83%",
        tone: "rose",
      },
      content: [
        {
          type: "paragraph",
          text: "The old route still lines up with the modern ridge road, down to the last switchback.",
        },
      ],
    },
  ],
});

export const storyRegistry = createStoryRendererRegistry<SignalStoryData>({
  web: {
    "signal-stage": SignalStage,
  },
});

function SignalStage({ node, progress, currentIndex }: StoryRenderProps<SignalStoryData>) {
  const data = node.data;

  return (
    <section className={`demo-stage demo-stage-${data?.tone ?? "cyan"}`}>
      {data ? <img className="demo-stage-image" src={data.imageSrc} alt={data.imageAlt} /> : null}
      <div className="demo-stage-scrim" />
      <div className="demo-stage-grid" aria-hidden="true" />

      <div className="demo-stage-content">
        <div className="demo-stage-copy">
          {node.eyebrow ? <p className="demo-stage-eyebrow">{node.eyebrow}</p> : null}
          <h2>{node.title}</h2>
          <StoryContent content={node.content} className="demo-stage-body" />
        </div>

        <dl className="demo-stage-instrument">
          <div>
            <dt>Scene</dt>
            <dd>{String(currentIndex + 1).padStart(2, "0")}</dd>
          </div>
          {data ? (
            <>
              <div>
                <dt>{data.metricLabel}</dt>
                <dd>{data.metricValue}</dd>
              </div>
              <div>
                <dt>Channel</dt>
                <dd>{data.channel}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{data.location}</dd>
              </div>
            </>
          ) : null}
        </dl>
      </div>

      <div className="demo-stage-meter" aria-hidden="true">
        <span style={{ width: `${Math.max(progress * 100, 12)}%` }} />
      </div>
    </section>
  );
}
