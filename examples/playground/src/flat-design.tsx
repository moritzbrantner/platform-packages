import { useMemo, useState, type MouseEvent } from "react";

import {
  FlatScene,
  createFlatBadgeFigure,
  createFlatCardFigure,
  createFlatCloudFigure,
  createFlatShowcaseScene,
  createFlatSparkleFigure,
  createFlatSunFigure,
  createTimelineAnimations,
  renderFlatSceneToSvg,
  type FlatBuiltInFigureAnimationPreset,
  type FlatColorPalette,
  type FlatDesignScene,
  type FlatFigureAnimationOptions,
  type FlatMotionKeyframe,
  type FlatShape,
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

type NodeMotionConfig = {
  duration: number;
  keyframes: FlatMotionKeyframe[];
};

type SvgNodeOption = {
  id: string;
  label: string;
  kind: FlatShape["kind"];
  depth: number;
  animated: boolean;
};

type TimelineField = "opacity" | "rotate" | "scale" | "time" | "x" | "y";

const initialNodeMotionConfigs: Record<string, NodeMotionConfig> = {
  "custom-sun": {
    duration: 5.4,
    keyframes: [
      { time: 0, scale: 1, opacity: 1 },
      { time: 0.5, scale: 1.08, opacity: 0.82 },
      { time: 1, scale: 1, opacity: 1 },
    ],
  },
  "custom-cloud": {
    duration: 8.6,
    keyframes: [
      { time: 0, x: 0, y: 0 },
      { time: 0.5, x: 14, y: 0 },
      { time: 1, x: 0, y: 0 },
    ],
  },
  "custom-card": {
    duration: 5.4,
    keyframes: [
      { time: 0, scale: 1, opacity: 1 },
      { time: 0.5, scale: 1.06, opacity: 0.86 },
      { time: 1, scale: 1, opacity: 1 },
    ],
  },
  "custom-badge": {
    duration: 4.1,
    keyframes: [
      { time: 0, y: 0 },
      { time: 0.5, y: -10 },
      { time: 1, y: 0 },
    ],
  },
  "custom-sparkle": {
    duration: 4.8,
    keyframes: [
      { time: 0, scale: 0.9, opacity: 1 },
      { time: 0.5, scale: 1.15, opacity: 0.45 },
      { time: 1, scale: 0.9, opacity: 1 },
    ],
  },
};

function cloneTimelineFrames(keyframes: FlatMotionKeyframe[]): FlatMotionKeyframe[] {
  return keyframes.map((keyframe) => ({ ...keyframe }));
}

function cloneNodeMotionConfigs(
  configs: Record<string, NodeMotionConfig>,
): Record<string, NodeMotionConfig> {
  return Object.fromEntries(
    Object.entries(configs).map(([id, config]) => [
      id,
      {
        duration: config.duration,
        keyframes: cloneTimelineFrames(config.keyframes),
      },
    ]),
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readNumericFrameValue(keyframe: FlatMotionKeyframe, field: TimelineField): number {
  const value = keyframe[field];

  return typeof value === "number" ? value : 0;
}

function createConfigFromPreset(presetId: string): NodeMotionConfig {
  const preset = motionPresets.find((candidate) => candidate.id === presetId) ?? motionPresets[0];
  const options = preset.options;

  switch (preset.id) {
    case "bobbing":
      return {
        duration: Number.parseFloat(options.dur ?? "4.6"),
        keyframes: [
          { time: 0, x: 0, y: 0 },
          {
            time: 0.5,
            x: options.axis === "x" ? (options.distance ?? 12) : 0,
            y: options.axis === "x" ? 0 : -(options.distance ?? 12),
          },
          { time: 1, x: 0, y: 0 },
        ],
      };
    case "drift":
      return {
        duration: Number.parseFloat(options.dur ?? "9"),
        keyframes: [
          { time: 0, x: 0, y: 0 },
          {
            time: 0.5,
            x: options.axis === "y" ? 0 : (options.distance ?? 18),
            y: options.axis === "y" ? (options.distance ?? 18) : 0,
          },
          { time: 1, x: 0, y: 0 },
        ],
      };
    case "float":
      return {
        duration: Number.parseFloat(options.dur ?? "7.5"),
        keyframes: [
          { time: 0, x: 0, y: 0 },
          { time: 0.38, x: options.drift ?? 8, y: -(options.distance ?? 16) },
          {
            time: 0.72,
            x: -(options.drift ?? 8) * 0.5,
            y: -(options.distance ?? 16) * 0.35,
          },
          { time: 1, x: 0, y: 0 },
        ],
      };
    case "pulse":
      return {
        duration: Number.parseFloat(options.dur ?? "6.4"),
        keyframes: [
          { time: 0, scale: options.from ?? 1, opacity: options.maxOpacity ?? 1 },
          {
            time: 0.5,
            scale: options.to ?? 1.05,
            opacity: options.minOpacity ?? 0.72,
          },
          { time: 1, scale: options.from ?? 1, opacity: options.maxOpacity ?? 1 },
        ],
      };
    case "pop":
      return {
        duration: Number.parseFloat(options.dur ?? "3.2"),
        keyframes: [
          { time: 0, scale: options.from ?? 1 },
          { time: 0.35, scale: options.to ?? 1.12 },
          { time: 0.68, scale: 0.98 },
          { time: 1, scale: options.from ?? 1 },
        ],
      };
    case "sway":
      return {
        duration: Number.parseFloat(options.dur ?? "5.8"),
        keyframes: [
          { time: 0, rotate: -(options.angle ?? 5) },
          { time: 0.5, rotate: options.angle ?? 5 },
          { time: 1, rotate: -(options.angle ?? 5) },
        ],
      };
    case "spin":
      return {
        duration: Number.parseFloat(options.dur ?? "18"),
        keyframes: [
          { time: 0, rotate: 0 },
          { time: 1, rotate: options.angle ?? 360 },
        ],
      };
    case "blink":
      return {
        duration: Number.parseFloat(options.dur ?? "3.8"),
        keyframes: [
          { time: 0, opacity: options.maxOpacity ?? 1 },
          { time: 0.5, opacity: options.minOpacity ?? 0.72 },
          { time: 1, opacity: options.maxOpacity ?? 1 },
        ],
      };
  }
}

function formatNodeLabel(id: string): string {
  return id
    .replace(/^custom-/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createTimelineAnimationsFromConfig(config: NodeMotionConfig) {
  return createTimelineAnimations({
    keyframes: cloneTimelineFrames(config.keyframes),
    dur: `${config.duration}s`,
    repeatCount: "indefinite",
  });
}

function createShapeClassName(id: string, selectedNodeId: string): string {
  return id === selectedNodeId ? "flat-node flat-node-selected" : "flat-node";
}

function assignShapeEditorState(
  shape: FlatShape,
  parentId: string,
  index: number,
  selectedNodeId: string,
  nodeMotionConfigs: Record<string, NodeMotionConfig>,
  animate: boolean,
): FlatShape {
  const id = shape.id ?? `${parentId}-${index + 1}-${shape.kind}`;
  const animations =
    animate && nodeMotionConfigs[id]
      ? createTimelineAnimationsFromConfig(nodeMotionConfigs[id])
      : shape.animations;

  if (shape.kind !== "group") {
    return {
      ...shape,
      id,
      className: createShapeClassName(id, selectedNodeId),
      animations,
    };
  }

  return {
    ...shape,
    id,
    className: createShapeClassName(id, selectedNodeId),
    animations,
    children: shape.children.map((child, childIndex) =>
      assignShapeEditorState(child, id, childIndex, selectedNodeId, nodeMotionConfigs, animate),
    ),
  };
}

function prepareEditableScene(
  scene: FlatDesignScene,
  selectedNodeId: string,
  nodeMotionConfigs: Record<string, NodeMotionConfig>,
  animate: boolean,
): FlatDesignScene {
  return {
    ...scene,
    layers: scene.layers.map((layer, layerIndex) => {
      const layerId = layer.id ?? `layer-${layerIndex + 1}`;

      return {
        ...layer,
        id: layerId,
        shapes: layer.shapes.map((shape, shapeIndex) =>
          assignShapeEditorState(
            shape,
            layerId,
            shapeIndex,
            selectedNodeId,
            nodeMotionConfigs,
            animate,
          ),
        ),
      };
    }),
  };
}

function collectShapeNodes(shapes: FlatShape[], depth = 0): SvgNodeOption[] {
  return shapes.flatMap((shape) => {
    const current = shape.id
      ? [
          {
            id: shape.id,
            label: formatNodeLabel(shape.id),
            kind: shape.kind,
            depth,
            animated: Boolean(shape.animations?.length),
          },
        ]
      : [];

    if (shape.kind !== "group") {
      return current;
    }

    return [...current, ...collectShapeNodes(shape.children, depth + 1)];
  });
}

function collectSceneNodes(scene: FlatDesignScene): SvgNodeOption[] {
  return scene.layers.flatMap((layer) => collectShapeNodes(layer.shapes));
}

function getFrameSeconds(keyframe: FlatMotionKeyframe, duration: number): number {
  return keyframe.time * duration;
}

function createDefaultNodeMotionConfig(): NodeMotionConfig {
  return {
    duration: 6,
    keyframes: cloneTimelineFrames(defaultTimelineFrames),
  };
}

function createBadgeScene(
  accent: string,
  animate: boolean,
  nodeMotionConfigs: Record<string, NodeMotionConfig>,
  selectedNodeId: string,
): FlatDesignScene {
  const scene: FlatDesignScene = {
    width: 320,
    height: 220,
    title: "Figure helpers",
    background: "#F6F9FF",
    layers: [
      {
        shapes: [
          createFlatSunFigure({
            id: "custom-sun",
            className: selectedNodeId === "custom-sun" ? "flat-node-selected" : "flat-node",
            x: 58,
            y: 52,
            scale: 0.72,
            color: "#FFC95C",
            haloColor: "#FFC95C",
          }),
          createFlatCloudFigure({
            id: "custom-cloud",
            className: selectedNodeId === "custom-cloud" ? "flat-node-selected" : "flat-node",
            x: 108,
            y: 64,
            scale: 0.88,
          }),
          createFlatCardFigure({
            id: "custom-card",
            className: selectedNodeId === "custom-card" ? "flat-node-selected" : "flat-node",
            x: 128,
            y: 122,
            width: 132,
            height: 86,
            surface: accent,
            detail: "#FFFFFF",
            accent: "#FFFFFF",
          }),
          createFlatBadgeFigure({
            id: "custom-badge",
            className: selectedNodeId === "custom-badge" ? "flat-node-selected" : "flat-node",
            x: 252,
            y: 72,
            scale: 0.44,
            color: "#111827",
            highlight: "#FFFFFF",
            checkColor: "#111827",
          }),
          createFlatSparkleFigure({
            id: "custom-sparkle",
            className: selectedNodeId === "custom-sparkle" ? "flat-node-selected" : "flat-node",
            x: 268,
            y: 152,
            color: accent,
          }),
        ],
      },
    ],
  };

  return prepareEditableScene(scene, selectedNodeId, nodeMotionConfigs, animate);
}

function FlatDesignPage() {
  const [animate, setAnimate] = useState(true);
  const [paletteId, setPaletteId] = useState<(typeof palettePresets)[number]["id"]>("day");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("custom-card");
  const [activeKeyframeIndex, setActiveKeyframeIndex] = useState(0);
  const [nodeMotionConfigs, setNodeMotionConfigs] = useState<Record<string, NodeMotionConfig>>(() =>
    cloneNodeMotionConfigs(initialNodeMotionConfigs),
  );
  const [presetName, setPresetName] = useState("Selected node motion");
  const [savedMotionPresets, setSavedMotionPresets] = useState<SavedMotionPreset[]>([]);

  const activePreset =
    palettePresets.find((preset) => preset.id === paletteId) ?? palettePresets[0];
  const motionChoices = [
    ...motionPresets.map((preset) => ({ id: preset.id, label: preset.label })),
    ...savedMotionPresets.map((preset) => ({
      id: preset.id,
      label: preset.label,
    })),
  ];

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
    () =>
      createBadgeScene(
        activePreset.palette.accentAlt ?? "#2D7FF9",
        animate,
        nodeMotionConfigs,
        selectedNodeId,
      ),
    [activePreset.palette.accentAlt, animate, nodeMotionConfigs, selectedNodeId],
  );
  const nodeOptions = useMemo(() => collectSceneNodes(customScene), [customScene]);
  const nodeOptionIds = useMemo(
    () => new Set(nodeOptions.map((option) => option.id)),
    [nodeOptions],
  );
  const selectedMotionConfig = nodeMotionConfigs[selectedNodeId] ?? createDefaultNodeMotionConfig();
  const selectedKeyframe =
    selectedMotionConfig.keyframes[
      Math.min(activeKeyframeIndex, selectedMotionConfig.keyframes.length - 1)
    ] ?? selectedMotionConfig.keyframes[0];
  const selectedNode = nodeOptions.find((option) => option.id === selectedNodeId);

  const svgPreview = useMemo(() => {
    const svg = renderFlatSceneToSvg(customScene, {
      width: 320,
      height: 220,
    });

    return svg.length > 440 ? `${svg.slice(0, 440)}...` : svg;
  }, [customScene]);

  function updateSelectedMotionConfig(updater: (config: NodeMotionConfig) => NodeMotionConfig) {
    setNodeMotionConfigs((configs) => {
      const current = configs[selectedNodeId] ?? createDefaultNodeMotionConfig();
      const next = updater({
        duration: current.duration,
        keyframes: cloneTimelineFrames(current.keyframes),
      });

      return {
        ...configs,
        [selectedNodeId]: {
          duration: clamp(next.duration, 1, 30),
          keyframes: next.keyframes.map((keyframe) => ({
            ...keyframe,
            time: clamp(keyframe.time, 0, 1),
            opacity:
              typeof keyframe.opacity === "number"
                ? clamp(keyframe.opacity, 0, 1)
                : keyframe.opacity,
            scale:
              typeof keyframe.scale === "number" ? clamp(keyframe.scale, 0.2, 3) : keyframe.scale,
          })),
        },
      };
    });
  }

  function updateTimelineFrame(index: number, field: TimelineField, rawValue: number) {
    const value =
      field === "time"
        ? clamp(rawValue, 0, 1)
        : field === "opacity"
          ? clamp(rawValue, 0, 1)
          : field === "scale"
            ? clamp(rawValue, 0.2, 3)
            : rawValue;

    updateSelectedMotionConfig((config) => ({
      ...config,
      keyframes: config.keyframes.map((frame, frameIndex) =>
        frameIndex === index ? { ...frame, [field]: value } : frame,
      ),
    }));
  }

  function selectNode(nodeId: string) {
    setSelectedNodeId(nodeId);
    setActiveKeyframeIndex(0);
  }

  function selectNodeFromSvg(event: MouseEvent<HTMLDivElement>) {
    let target = event.target instanceof Element ? event.target : null;

    while (target && target !== event.currentTarget) {
      const id = target.id;

      if (id && nodeOptionIds.has(id)) {
        selectNode(id);
        return;
      }

      target = target.parentElement;
    }
  }

  function applyMotionPresetToSelected(id: string) {
    const savedPreset = savedMotionPresets.find((preset) => preset.id === id);
    const config = savedPreset
      ? {
          duration: savedPreset.duration,
          keyframes: cloneTimelineFrames(savedPreset.keyframes),
        }
      : createConfigFromPreset(id);

    setNodeMotionConfigs((configs) => ({
      ...configs,
      [selectedNodeId]: config,
    }));
    setActiveKeyframeIndex(0);
  }

  function setSelectedDuration(duration: number) {
    updateSelectedMotionConfig((config) => ({
      ...config,
      duration,
    }));
  }

  function addTimelinePoint(time: number) {
    const normalizedTime = clamp(time, 0, 1);
    const existingIndex = selectedMotionConfig.keyframes.findIndex(
      (keyframe) => Math.abs(keyframe.time - normalizedTime) < 0.015,
    );

    if (existingIndex >= 0) {
      setActiveKeyframeIndex(existingIndex);
      return;
    }

    const source = selectedKeyframe ?? { time: normalizedTime };
    const nextFrames = [
      ...selectedMotionConfig.keyframes,
      {
        ...source,
        time: normalizedTime,
      },
    ].sort((a, b) => a.time - b.time);
    const newIndex = nextFrames.findIndex((keyframe) => keyframe.time === normalizedTime);

    updateSelectedMotionConfig((config) => ({
      ...config,
      keyframes: nextFrames,
    }));
    setActiveKeyframeIndex(Math.max(0, newIndex));
  }

  function addTimelinePointFromTrack(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const time = (event.clientX - rect.left) / rect.width;

    addTimelinePoint(time);
  }

  function deleteActiveTimelinePoint() {
    if (selectedMotionConfig.keyframes.length <= 2) {
      return;
    }

    const nextFrames = selectedMotionConfig.keyframes.filter(
      (_keyframe, index) => index !== activeKeyframeIndex,
    );

    updateSelectedMotionConfig((config) => ({
      ...config,
      keyframes: nextFrames,
    }));
    setActiveKeyframeIndex(Math.max(0, activeKeyframeIndex - 1));
  }

  function clearSelectedMotion() {
    setNodeMotionConfigs((configs) => {
      const next = { ...configs };
      delete next[selectedNodeId];
      return next;
    });
    setActiveKeyframeIndex(0);
  }

  function saveTimelinePreset() {
    const label = presetName.trim() || `Motion ${savedMotionPresets.length + 1}`;
    const id = `saved-motion-${savedMotionPresets.length + 1}`;
    const config = selectedMotionConfig;

    setSavedMotionPresets((presets) => [
      ...presets,
      {
        id,
        label,
        duration: config.duration,
        keyframes: cloneTimelineFrames(config.keyframes),
      },
    ]);
  }

  return (
    <PlaygroundPage
      activePage="flat-design"
      title="Flat design package examples"
      description="A typed SVG scene builder for flat illustrations and lightweight motion. This page exercises the preset scene, custom composition, palette overrides, and raw SVG export."
    >
      <style>
        {`
          .flat-node {
            cursor: pointer;
            transition: filter 160ms ease;
          }

          .flat-node:hover {
            filter: drop-shadow(0 0 6px rgb(45 127 249 / 0.45));
          }

          .flat-node-selected {
            filter: drop-shadow(0 0 8px rgb(45 127 249 / 0.85));
          }
        `}
      </style>
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
                  The package ships with a ready-made flat illustration preset, but the scene
                  remains plain data all the way down to the SVG nodes.
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

        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5 xl:col-span-2">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              Node motion
            </Badge>
            <div className="space-y-2">
              <CardTitle className="text-2xl">SVG node timeline</CardTitle>
              <CardDescription className="text-sm leading-6">
                Select a scene node, then shape that node's keyframes across the timeline.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div
                className="rounded-xl border border-border/60 bg-white/70 p-4"
                onClick={selectNodeFromSvg}
              >
                <AspectRatio ratio={16 / 10}>
                  <FlatScene
                    scene={customScene}
                    width="100%"
                    height="100%"
                    style={{ display: "block", width: "100%", height: "100%" }}
                  />
                </AspectRatio>
              </div>

              <div className="rounded-xl border border-border/60 bg-white/70 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    SVG node
                  </span>
                  <Badge variant="secondary" className="rounded-full">
                    {selectedNode?.kind ?? "node"}
                  </Badge>
                </div>
                <div className="max-h-[19rem] space-y-1 overflow-auto pr-1">
                  {nodeOptions.map((node) => (
                    <Button
                      key={node.id}
                      type="button"
                      variant={node.id === selectedNodeId ? "default" : "ghost"}
                      className={[
                        "flex h-auto w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm transition",
                        node.id === selectedNodeId
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted",
                      ].join(" ")}
                      style={{ paddingLeft: `${8 + node.depth * 14}px` }}
                      onClick={() => selectNode(node.id)}
                    >
                      <span className="min-w-0 truncate">{node.label}</span>
                      <span
                        className={[
                          "shrink-0 rounded-full px-2 py-0.5 text-[0.68rem]",
                          node.id === selectedNodeId
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        ].join(" ")}
                      >
                        {node.animated ? "motion" : node.kind}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4 rounded-xl border border-border/60 bg-white/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Apply
                </span>
                {motionChoices.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => applyMotionPresetToSelected(preset.id)}
                  >
                    {preset.label}
                  </Button>
                ))}
                <Button type="button" size="sm" variant="ghost" onClick={clearSelectedMotion}>
                  Clear
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_7rem_auto_auto] md:items-end">
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
                    value={selectedMotionConfig.duration}
                    onChange={(event) => setSelectedDuration(Number(event.target.value))}
                  />
                </label>
                <Button type="button" variant="secondary" onClick={saveTimelinePreset}>
                  Save preset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={deleteActiveTimelinePoint}
                  disabled={selectedMotionConfig.keyframes.length <= 2}
                >
                  Delete point
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>0s</span>
                  <span>
                    {formatNodeLabel(selectedNodeId)} · {selectedMotionConfig.duration.toFixed(1)}s
                  </span>
                  <span>{selectedMotionConfig.duration.toFixed(1)}s</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="relative h-12 w-full rounded-md border border-border bg-background"
                  onClick={addTimelinePointFromTrack}
                >
                  <span className="absolute left-3 right-3 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
                  {selectedMotionConfig.keyframes.map((keyframe, index) => (
                    <span
                      key={`${keyframe.time}-${index}`}
                      className={[
                        "absolute top-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[0.65rem] font-semibold shadow-sm",
                        index === activeKeyframeIndex
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-white text-foreground",
                      ].join(" ")}
                      style={{ left: `${keyframe.time * 100}%` }}
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveKeyframeIndex(index);
                      }}
                    >
                      {index + 1}
                    </span>
                  ))}
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
                    {selectedMotionConfig.keyframes.map((keyframe, index) => (
                      <tr
                        key={index}
                        className={[
                          "align-top",
                          index === activeKeyframeIndex ? "bg-primary/5" : "",
                        ].join(" ")}
                        onClick={() => setActiveKeyframeIndex(index)}
                      >
                        <td className="py-1.5 pr-3 text-xs font-medium text-muted-foreground">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto rounded-full border border-border px-2 py-1 text-foreground"
                            onClick={() => setActiveKeyframeIndex(index)}
                          >
                            {getFrameSeconds(keyframe, selectedMotionConfig.duration).toFixed(2)}s
                          </Button>
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
                                  updateTimelineFrame(index, field, Number(event.target.value))
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
