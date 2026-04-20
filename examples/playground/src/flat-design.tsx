import { useMemo, useState } from "react";

import {
  FlatScene,
  createFlatBadgeFigure,
  createFlatCardFigure,
  createFlatCloudFigure,
  createFlatShowcaseScene,
  createFlatSparkleFigure,
  createFlatSunFigure,
  renderFlatSceneToSvg,
  type FlatBuiltInFigureAnimationPreset,
  type FlatColorPalette,
  type FlatDesignScene,
  type FlatFigureAnimationOptions,
  type FlatFigureMotion,
  type FlatMotionKeyframe,
} from "@moritzbrantner/flat-design";
import {
  AspectRatio,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

const palettePresets: ReadonlyArray<{
  id: string;
  label: string;
  palette: Partial<FlatColorPalette>;
}> = [
  {
    id: "day",
    label: "Daylight",
    palette: {},
  },
  {
    id: "mint",
    label: "Mint pop",
    palette: {
      accent: "#FFC95C",
      accentAlt: "#0EA5A4",
      surface: "#DDF9F5",
      surfaceAlt: "#95E4DA",
    },
  },
  {
    id: "sunset",
    label: "Sunset",
    palette: {
      accent: "#FF8E5A",
      accentAlt: "#7C4DFF",
      surface: "#FFE3D5",
      surfaceAlt: "#FFC2A9",
      background: "#FFF3ED",
    },
  },
];

const motionPresets: ReadonlyArray<{
  id: FlatBuiltInFigureAnimationPreset;
  label: string;
  options: FlatFigureAnimationOptions;
}> = [
  {
    id: "float",
    label: "Float",
    options: { distance: 16, drift: 8, dur: "7.5s" },
  },
  {
    id: "bobbing",
    label: "Bobbing",
    options: { distance: 11, dur: "4.6s" },
  },
  {
    id: "drift",
    label: "Drift",
    options: { distance: 16, dur: "8.8s" },
  },
  {
    id: "pulse",
    label: "Pulse",
    options: { from: 1, to: 1.08, minOpacity: 0.76, maxOpacity: 1, dur: "5.4s" },
  },
  {
    id: "pop",
    label: "Pop",
    options: { from: 1, to: 1.14, dur: "3.2s" },
  },
  {
    id: "sway",
    label: "Sway",
    options: { angle: 6, dur: "5.8s" },
  },
  {
    id: "spin",
    label: "Spin",
    options: { angle: 360, dur: "18s" },
  },
  {
    id: "blink",
    label: "Blink",
    options: { minOpacity: 0.45, maxOpacity: 1, dur: "3.8s" },
  },
];

const defaultTimelineFrames: FlatMotionKeyframe[] = [
  { time: 0, x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 },
  { time: 0.33, x: 12, y: -14, scale: 1.06, rotate: -4, opacity: 0.86 },
  { time: 0.66, x: -8, y: -4, scale: 0.98, rotate: 5, opacity: 1 },
  { time: 1, x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 },
];

type SavedMotionPreset = {
  id: string;
  label: string;
  duration: number;
  keyframes: FlatMotionKeyframe[];
};

type TimelineField = "opacity" | "rotate" | "scale" | "time" | "x" | "y";

function cloneTimelineFrames(keyframes: FlatMotionKeyframe[]): FlatMotionKeyframe[] {
  return keyframes.map((keyframe) => ({ ...keyframe }));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readNumericFrameValue(
  keyframe: FlatMotionKeyframe,
  field: TimelineField,
): number {
  const value = keyframe[field];

  return typeof value === "number" ? value : 0;
}

function createTimelineMotion(
  keyframes: FlatMotionKeyframe[],
  duration: number,
): FlatFigureMotion {
  return {
    preset: "timeline",
    options: {
      keyframes: cloneTimelineFrames(keyframes),
      dur: `${duration}s`,
      repeatCount: "indefinite",
    },
  };
}

function createPresetMotion(presetId: string): FlatFigureMotion {
  const preset = motionPresets.find((candidate) => candidate.id === presetId) ?? motionPresets[0];

  return {
    preset: preset.id,
    options: preset.options,
  };
}

function withMotionBegin(motion: FlatFigureMotion, begin: string): FlatFigureMotion {
  if (!motion || typeof motion === "string") {
    return motion;
  }

  if (motion.preset === "timeline") {
    return {
      preset: "timeline",
      options: {
        ...motion.options,
        begin,
      },
    };
  }

  return {
    preset: motion.preset,
    options: {
      ...motion.options,
      begin,
    },
  };
}

function createBadgeScene(
  accent: string,
  animate: boolean,
  motion: FlatFigureMotion,
): FlatDesignScene {
  const activeMotion = animate ? motion : false;

  return {
    width: 320,
    height: 220,
    title: "Figure helpers",
    background: "#F6F9FF",
    layers: [
      {
        shapes: [
          createFlatSunFigure({
            x: 58,
            y: 52,
            scale: 0.72,
            color: "#FFC95C",
            haloColor: "#FFC95C",
            motion: withMotionBegin(activeMotion, "0s"),
          }),
          createFlatCloudFigure({
            x: 108,
            y: 64,
            scale: 0.88,
            motion: withMotionBegin(activeMotion, "0.35s"),
          }),
          createFlatCardFigure({
            x: 128,
            y: 122,
            width: 132,
            height: 86,
            surface: accent,
            detail: "#FFFFFF",
            accent: "#FFFFFF",
            motion: withMotionBegin(activeMotion, "0.7s"),
          }),
          createFlatBadgeFigure({
            x: 252,
            y: 72,
            scale: 0.44,
            color: "#111827",
            highlight: "#FFFFFF",
            checkColor: "#111827",
            motion: withMotionBegin(activeMotion, "1.05s"),
          }),
          createFlatSparkleFigure({
            x: 268,
            y: 152,
            color: accent,
            motion: withMotionBegin(activeMotion, "1.4s"),
          }),
        ],
      },
    ],
  };
}

function FlatDesignPage() {
  const [animate, setAnimate] = useState(true);
  const [paletteId, setPaletteId] = useState<(typeof palettePresets)[number]["id"]>("day");
  const [motionId, setMotionId] = useState<string>("float");
  const [timelineDuration, setTimelineDuration] = useState(6);
  const [timelineFrames, setTimelineFrames] = useState<FlatMotionKeyframe[]>(
    () => cloneTimelineFrames(defaultTimelineFrames),
  );
  const [presetName, setPresetName] = useState("Lift and turn");
  const [savedMotionPresets, setSavedMotionPresets] = useState<SavedMotionPreset[]>([]);

  const activePreset = palettePresets.find((preset) => preset.id === paletteId) ?? palettePresets[0];
  const motionChoices = [
    ...motionPresets.map((preset) => ({ id: preset.id, label: preset.label })),
    { id: "custom-timeline", label: "Custom timeline" },
    ...savedMotionPresets.map((preset) => ({
      id: preset.id,
      label: preset.label,
    })),
  ];
  const activeMotion = useMemo(() => {
    if (motionId === "custom-timeline") {
      return createTimelineMotion(timelineFrames, timelineDuration);
    }

    const savedPreset = savedMotionPresets.find((preset) => preset.id === motionId);

    if (savedPreset) {
      return createTimelineMotion(savedPreset.keyframes, savedPreset.duration);
    }

    return createPresetMotion(motionId);
  }, [motionId, savedMotionPresets, timelineDuration, timelineFrames]);

  const showcaseScene = useMemo(
    () =>
      createFlatShowcaseScene({
        animate,
        palette: activePreset.palette,
        title: "Flat design hero",
        description: "Preset scene rendered by the flat-design package.",
      }),
    [activePreset.palette, animate],
  );

  const customScene = useMemo(
    () => createBadgeScene(activePreset.palette.accentAlt ?? "#2D7FF9", animate, activeMotion),
    [activeMotion, activePreset.palette.accentAlt, animate],
  );

  const svgPreview = useMemo(() => {
    const svg = renderFlatSceneToSvg(showcaseScene, {
      width: 800,
      height: 480,
    });

    return svg.length > 440 ? `${svg.slice(0, 440)}...` : svg;
  }, [showcaseScene]);

  function selectMotionPreset(id: string) {
    const savedPreset = savedMotionPresets.find((preset) => preset.id === id);

    if (savedPreset) {
      setTimelineDuration(savedPreset.duration);
      setTimelineFrames(cloneTimelineFrames(savedPreset.keyframes));
    }

    setMotionId(id);
  }

  function updateTimelineFrame(
    index: number,
    field: TimelineField,
    rawValue: number,
  ) {
    const value =
      field === "time"
        ? clamp(rawValue, 0, 1)
        : field === "opacity"
          ? clamp(rawValue, 0, 1)
          : field === "scale"
            ? clamp(rawValue, 0.2, 3)
            : rawValue;

    setTimelineFrames((frames) =>
      frames.map((frame, frameIndex) =>
        frameIndex === index ? { ...frame, [field]: value } : frame,
      ),
    );
    setMotionId("custom-timeline");
  }

  function saveTimelinePreset() {
    const label = presetName.trim() || `Motion ${savedMotionPresets.length + 1}`;
    const id = `saved-motion-${savedMotionPresets.length + 1}`;

    setSavedMotionPresets((presets) => [
      ...presets,
      {
        id,
        label,
        duration: timelineDuration,
        keyframes: cloneTimelineFrames(timelineFrames),
      },
    ]);
    setMotionId(id);
  }

  return (
    <PlaygroundPage
      activePage="flat-design"
      title="Flat design package examples"
      description="A typed SVG scene builder for flat illustrations and lightweight motion. This page exercises the preset scene, custom composition, palette overrides, and raw SVG export."
    >
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                @moritzbrantner/flat-design
              </Badge>
              <div className="space-y-2">
                <CardTitle className="text-2xl">Preset showcase scene</CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-6">
                  The package ships with a ready-made flat illustration preset, but the
                  scene remains plain data all the way down to the SVG nodes.
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={animate ? "default" : "outline"}
                onClick={() => setAnimate((value) => !value)}
              >
                {animate ? "Disable motion" : "Enable motion"}
              </Button>
              {palettePresets.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  variant={preset.id === activePreset.id ? "default" : "outline"}
                  onClick={() => setPaletteId(preset.id)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <AspectRatio
              ratio={16 / 10}
              className="overflow-hidden rounded-xl border border-border/60 bg-white/60 p-4"
            >
              <FlatScene
                scene={showcaseScene}
                width="100%"
                height="100%"
                style={{ display: "block", width: "100%", height: "100%" }}
              />
            </AspectRatio>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              Custom scene
            </Badge>
            <div className="space-y-2">
              <CardTitle className="text-2xl">Composable primitives</CardTitle>
              <CardDescription className="text-sm leading-6">
                Compose scenes from packaged figure helpers, packaged motion presets,
                and keyframed timeline presets.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <AspectRatio
              ratio={16 / 10}
              className="rounded-xl border border-border/60 bg-white/70 p-4"
            >
              <FlatScene
                scene={customScene}
                width="100%"
                height="100%"
                style={{ display: "block", width: "100%", height: "100%" }}
              />
            </AspectRatio>
            <div className="space-y-4 rounded-xl border border-border/60 bg-white/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Motion
                </span>
                {motionChoices.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    size="sm"
                    variant={preset.id === motionId ? "default" : "outline"}
                    onClick={() => selectMotionPreset(preset.id)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_7rem_auto] md:items-end">
                <label className="grid gap-1 text-xs font-medium text-foreground">
                  Preset name
                  <input
                    className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
                    value={presetName}
                    onChange={(event) => setPresetName(event.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-xs font-medium text-foreground">
                  Duration
                  <input
                    className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
                    type="number"
                    min="1"
                    max="30"
                    step="0.5"
                    value={timelineDuration}
                    onChange={(event) => {
                      setTimelineDuration(clamp(Number(event.target.value), 1, 30));
                      setMotionId("custom-timeline");
                    }}
                  />
                </label>
                <Button type="button" variant="secondary" onClick={saveTimelinePreset}>
                  Save preset
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-3 font-semibold">Frame</th>
                      <th className="pb-2 pr-3 font-semibold">Time</th>
                      <th className="pb-2 pr-3 font-semibold">X</th>
                      <th className="pb-2 pr-3 font-semibold">Y</th>
                      <th className="pb-2 pr-3 font-semibold">Scale</th>
                      <th className="pb-2 pr-3 font-semibold">Rotate</th>
                      <th className="pb-2 font-semibold">Opacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timelineFrames.map((keyframe, index) => (
                      <tr key={index} className="align-top">
                        <td className="py-1.5 pr-3 text-xs font-medium text-muted-foreground">
                          {index + 1}
                        </td>
                        {(["time", "x", "y", "scale", "rotate", "opacity"] as const).map(
                          (field) => (
                            <td key={field} className="py-1.5 pr-3 last:pr-0">
                              <input
                                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm outline-none transition focus:border-primary"
                                type="number"
                                min={
                                  field === "time" || field === "opacity"
                                    ? 0
                                    : field === "scale"
                                      ? 0.2
                                      : undefined
                                }
                                max={
                                  field === "time" || field === "opacity"
                                    ? 1
                                    : field === "scale"
                                      ? 3
                                      : undefined
                                }
                                step={
                                  field === "time" || field === "opacity" || field === "scale"
                                    ? 0.01
                                    : 1
                                }
                                value={readNumericFrameValue(keyframe, field)}
                                onChange={(event) =>
                                  updateTimelineFrame(
                                    index,
                                    field,
                                    Number(event.target.value),
                                  )
                                }
                              />
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Flat scenes are plain objects, so they work in React and export flows.</p>
              <p>The rendered markup below comes from `renderFlatSceneToSvg()`.</p>
            </div>
            <pre className="max-h-56 overflow-auto rounded-[1.25rem] border border-border/60 bg-slate-950 p-4 text-xs leading-5 text-slate-100">
              {svgPreview}
            </pre>
          </CardContent>
        </Card>
      </div>
    </PlaygroundPage>
  );
}

mountPage(<FlatDesignPage />);
