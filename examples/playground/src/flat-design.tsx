import { useEffect, useMemo, useState } from "react";

import {
  FlatScene,
  createFlatBadgeFigure,
  createFlatCardFigure,
  createFlatCloudFigure,
  createFlatShowcaseScene,
  createFlatSparkleFigure,
  createFlatSunFigure,
  renderFlatSceneToSvg,
  type FlatColorPalette,
  type FlatDesignScene,
  type FlatNodeRef,
  type FlatTimelineMotionSpec,
} from "@moritzbrantner/flat-design";
import {
  clearFlatNodeMotion,
  createEditableMotionFromPreset,
  findFlatNodeById,
  getFlatNode,
  listFlatNodes,
  normalizeEditableMotion,
  setFlatNodeMotion,
} from "@moritzbrantner/flat-design/core";
import {
  EditableFlatScene,
  FlatMotionTimelineEditor,
  useFlatSceneSelection,
} from "@moritzbrantner/flat-design/react";
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

const motionPresets = [
  {
    id: "float",
    label: "Float",
  },
  {
    id: "bobbing",
    label: "Bobbing",
  },
  {
    id: "drift",
    label: "Drift",
  },
  {
    id: "pulse",
    label: "Pulse",
  },
  {
    id: "pop",
    label: "Pop",
  },
  {
    id: "sway",
    label: "Sway",
  },
  {
    id: "spin",
    label: "Spin",
  },
  {
    id: "blink",
    label: "Blink",
  },
] as const;

const defaultTimelineMotion = normalizeEditableMotion({
  kind: "timeline",
  durationMs: 6_000,
  keyframes: [
    { timeMs: 0, x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 },
    { timeMs: 1_980, x: 12, y: -14, scale: 1.06, rotate: -4, opacity: 0.86 },
    { timeMs: 3_960, x: -8, y: -4, scale: 0.98, rotate: 5, opacity: 1 },
    { timeMs: 6_000, x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 },
  ],
});

const initialTimelineMotions: Record<string, FlatTimelineMotionSpec> = {
  "custom-sun": normalizeEditableMotion({
    kind: "timeline",
    durationMs: 5_400,
    keyframes: [
      { timeMs: 0, scale: 1, opacity: 1 },
      { timeMs: 2_700, scale: 1.08, opacity: 0.82 },
      { timeMs: 5_400, scale: 1, opacity: 1 },
    ],
  }),
  "custom-cloud": normalizeEditableMotion({
    kind: "timeline",
    durationMs: 8_600,
    keyframes: [
      { timeMs: 0, x: 0, y: 0 },
      { timeMs: 4_300, x: 14, y: 0 },
      { timeMs: 8_600, x: 0, y: 0 },
    ],
  }),
  "custom-card": normalizeEditableMotion({
    kind: "timeline",
    durationMs: 5_400,
    keyframes: [
      { timeMs: 0, scale: 1, opacity: 1 },
      { timeMs: 2_700, scale: 1.06, opacity: 0.86 },
      { timeMs: 5_400, scale: 1, opacity: 1 },
    ],
  }),
  "custom-badge": normalizeEditableMotion({
    kind: "timeline",
    durationMs: 4_100,
    keyframes: [
      { timeMs: 0, y: 0 },
      { timeMs: 2_050, y: -10 },
      { timeMs: 4_100, y: 0 },
    ],
  }),
  "custom-sparkle": normalizeEditableMotion({
    kind: "timeline",
    durationMs: 4_800,
    keyframes: [
      { timeMs: 0, scale: 0.9, opacity: 1 },
      { timeMs: 2_400, scale: 1.15, opacity: 0.45 },
      { timeMs: 4_800, scale: 0.9, opacity: 1 },
    ],
  }),
};

type SavedMotionPreset = {
  id: string;
  label: string;
  motion: FlatTimelineMotionSpec;
};

function cloneTimelineMotion(motion: FlatTimelineMotionSpec) {
  return normalizeEditableMotion({
    ...motion,
    rotateCenter: motion.rotateCenter ? { ...motion.rotateCenter } : motion.rotateCenter,
    keyframes: motion.keyframes.map((keyframe) => ({
      ...keyframe,
      scale:
        typeof keyframe.scale === "number"
          ? keyframe.scale
          : keyframe.scale
            ? { ...keyframe.scale }
            : keyframe.scale,
      rotate:
        typeof keyframe.rotate === "number"
          ? keyframe.rotate
          : keyframe.rotate
            ? { ...keyframe.rotate }
            : keyframe.rotate,
    })),
  });
}

function applyTimelineMotions(
  scene: FlatDesignScene,
  motions: Record<string, FlatTimelineMotionSpec>,
): FlatDesignScene {
  return Object.entries(motions).reduce((nextScene, [id, motion]) => {
    const ref = findFlatNodeById(nextScene, id);
    return ref ? setFlatNodeMotion(nextScene, ref, cloneTimelineMotion(motion)) : nextScene;
  }, scene);
}

function preserveTimelineMotions(
  baseScene: FlatDesignScene,
  previousScene: FlatDesignScene,
): FlatDesignScene {
  const preservedMotions = listFlatNodes(previousScene).reduce<Record<string, FlatTimelineMotionSpec>>(
    (motions, node) => {
      if (!node.id) {
        return motions;
      }

      const shape = getFlatNode(previousScene, node.ref);

      if (shape?.motion?.kind === "timeline") {
        motions[node.id] = cloneTimelineMotion(shape.motion);
      }

      return motions;
    },
    {},
  );

  return applyTimelineMotions(baseScene, preservedMotions);
}

function createBadgeScene(accent: string): FlatDesignScene {
  return {
    width: 320,
    height: 220,
    title: "Figure helpers",
    background: "#F6F9FF",
    layers: [
      {
        shapes: [
          createFlatSunFigure({
            id: "custom-sun",
            x: 58,
            y: 52,
            scale: 0.72,
            color: "#FFC95C",
            haloColor: "#FFC95C",
          }),
          createFlatCloudFigure({
            id: "custom-cloud",
            x: 108,
            y: 64,
            scale: 0.88,
          }),
          createFlatCardFigure({
            id: "custom-card",
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
            x: 252,
            y: 72,
            scale: 0.44,
            color: "#111827",
            highlight: "#FFFFFF",
            checkColor: "#111827",
          }),
          createFlatSparkleFigure({
            id: "custom-sparkle",
            x: 268,
            y: 152,
            color: accent,
          }),
        ],
      },
    ],
  };
}

function refsEqual(left?: FlatNodeRef, right?: FlatNodeRef) {
  if (!left || !right) {
    return left === right;
  }

  if (left.layerIndex !== right.layerIndex || left.path.length !== right.path.length) {
    return false;
  }

  return left.path.every((value, index) => value === right.path[index]);
}

function FlatDesignPage() {
  const [animate, setAnimate] = useState(true);
  const [paletteId, setPaletteId] = useState<(typeof palettePresets)[number]["id"]>("day");
  const [presetName, setPresetName] = useState("Selected node motion");
  const [savedMotionPresets, setSavedMotionPresets] = useState<SavedMotionPreset[]>([]);

  const activePreset =
    palettePresets.find((preset) => preset.id === paletteId) ?? palettePresets[0];
  const baseCustomScene = useMemo(
    () => createBadgeScene(activePreset.palette.accentAlt ?? "#2D7FF9"),
    [activePreset.palette.accentAlt],
  );
  const [customScene, setCustomScene] = useState<FlatDesignScene>(() =>
    applyTimelineMotions(createBadgeScene("#2D7FF9"), initialTimelineMotions),
  );
  const {
    nodes,
    selectedNode,
    selectedNodeRef,
    selectNode,
  } = useFlatSceneSelection(customScene);

  useEffect(() => {
    setCustomScene((scene) => preserveTimelineMotions(baseCustomScene, scene));
  }, [baseCustomScene]);

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
  const selectedNodeSummary = nodes.find((node) => refsEqual(node.ref, selectedNodeRef));
  const selectedMotion =
    selectedNode?.motion?.kind === "timeline"
      ? selectedNode.motion
      : cloneTimelineMotion(defaultTimelineMotion);
  const svgPreview = useMemo(() => {
    const svg = renderFlatSceneToSvg(customScene, {
      width: 320,
      height: 220,
    });

    return svg.length > 440 ? `${svg.slice(0, 440)}...` : svg;
  }, [customScene]);

  function applyMotionPreset(presetId: string) {
    if (!selectedNodeRef) {
      return;
    }

    const savedPreset = savedMotionPresets.find((preset) => preset.id === presetId);
    const motion = savedPreset
      ? cloneTimelineMotion(savedPreset.motion)
      : createEditableMotionFromPreset(presetId as (typeof motionPresets)[number]["id"]);

    setCustomScene((scene) => setFlatNodeMotion(scene, selectedNodeRef, motion));
  }

  function clearSelectedMotion() {
    if (!selectedNodeRef) {
      return;
    }

    setCustomScene((scene) => clearFlatNodeMotion(scene, selectedNodeRef));
  }

  function saveTimelinePreset() {
    const label = presetName.trim() || `Motion ${savedMotionPresets.length + 1}`;
    const id = `saved-motion-${savedMotionPresets.length + 1}`;

    setSavedMotionPresets((presets) => [
      ...presets,
      {
        id,
        label,
        motion: cloneTimelineMotion(selectedMotion),
      },
    ]);
  }

  return (
    <PlaygroundPage
      activePage="flat-design"
      title="Flat design package examples"
      description="A typed SVG scene builder for flat illustrations and lightweight motion. This page exercises the preset scene, scene-data editing, and raw SVG export."
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
                  The package still ships a ready-made flat illustration preset, but node editing
                  now sits on top of public scene and motion APIs.
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
                Selection, keyframe editing, and motion compilation all come from public package
                APIs now.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="rounded-xl border border-border/60 bg-white/70 p-4">
                <AspectRatio ratio={16 / 10}>
                  <EditableFlatScene
                    scene={customScene}
                    selectedNodeRef={selectedNodeRef}
                    onSelectedNodeChange={selectNode}
                    selectionClassName="flat-node-selected"
                    hoverClassName="flat-node"
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
                    {selectedNodeSummary?.kind ?? "node"}
                  </Badge>
                </div>
                <div className="max-h-[19rem] space-y-1 overflow-auto pr-1">
                  {nodes.map((node) => (
                    <Button
                      key={`${node.ref.layerIndex}:${node.ref.path.join(".")}`}
                      type="button"
                      variant={refsEqual(node.ref, selectedNodeRef) ? "default" : "ghost"}
                      className={[
                        "flex h-auto w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm transition",
                        refsEqual(node.ref, selectedNodeRef)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted",
                      ].join(" ")}
                      style={{ paddingLeft: `${8 + node.depth * 14}px` }}
                      onClick={() => selectNode(node.ref)}
                    >
                      <span className="min-w-0 truncate">{node.label}</span>
                      <span
                        className={[
                          "shrink-0 rounded-full px-2 py-0.5 text-[0.68rem]",
                          refsEqual(node.ref, selectedNodeRef)
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        ].join(" ")}
                      >
                        {node.hasMotion ? "motion" : node.kind}
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
                {motionPresets.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => applyMotionPreset(preset.id)}
                    disabled={!selectedNodeRef}
                  >
                    {preset.label}
                  </Button>
                ))}
                {savedMotionPresets.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => applyMotionPreset(preset.id)}
                    disabled={!selectedNodeRef}
                  >
                    {preset.label}
                  </Button>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={clearSelectedMotion}
                  disabled={!selectedNodeRef}
                >
                  Clear
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <label className="grid gap-1 text-xs font-medium text-foreground">
                  Preset name
                  <input
                    className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
                    value={presetName}
                    onChange={(event) => setPresetName(event.target.value)}
                  />
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={saveTimelinePreset}
                  disabled={!selectedNodeRef}
                >
                  Save preset
                </Button>
              </div>

              <FlatMotionTimelineEditor
                motion={selectedMotion}
                onMotionChange={(motion) => {
                  if (!selectedNodeRef) {
                    return;
                  }

                  setCustomScene((scene) => setFlatNodeMotion(scene, selectedNodeRef, motion));
                }}
                className="w-full"
                readOnly={!selectedNodeRef}
              />
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Flat scenes remain plain objects, so the same edited scene drives preview and export.</p>
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
