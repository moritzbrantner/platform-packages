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
  type FlatColorPalette,
  type FlatDesignScene,
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

function createBadgeScene(accent: string, animate: boolean): FlatDesignScene {
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
            motion: animate
              ? {
                  preset: "pulse",
                  options: {
                    from: 1,
                    to: 1.08,
                    minOpacity: 0.82,
                    maxOpacity: 1,
                    dur: "5.4s",
                  },
                }
              : false,
          }),
          createFlatCloudFigure({
            x: 108,
            y: 64,
            scale: 0.88,
            motion: animate
              ? { preset: "drift", options: { distance: 14, dur: "8.6s" } }
              : false,
          }),
          createFlatCardFigure({
            x: 128,
            y: 122,
            width: 132,
            height: 86,
            surface: accent,
            detail: "#FFFFFF",
            accent: "#FFFFFF",
            motion: animate
              ? {
                  preset: "pulse",
                  options: {
                    from: 1,
                    to: 1.06,
                    minOpacity: 0.86,
                    maxOpacity: 1,
                    dur: "5.4s",
                  },
                }
              : false,
          }),
          createFlatBadgeFigure({
            x: 252,
            y: 72,
            scale: 0.44,
            color: "#111827",
            highlight: "#FFFFFF",
            checkColor: "#111827",
            motion: animate
              ? { preset: "bobbing", options: { distance: 10, dur: "4.1s" } }
              : false,
          }),
          createFlatSparkleFigure({
            x: 268,
            y: 152,
            color: accent,
            motion: animate
              ? {
                  preset: "pulse",
                  options: {
                    from: 0.9,
                    to: 1.15,
                    minOpacity: 0.45,
                    maxOpacity: 1,
                    dur: "4.8s",
                  },
                }
              : false,
          }),
        ],
      },
    ],
  };
}

function FlatDesignPage() {
  const [animate, setAnimate] = useState(true);
  const [paletteId, setPaletteId] = useState<(typeof palettePresets)[number]["id"]>("day");

  const activePreset = palettePresets.find((preset) => preset.id === paletteId) ?? palettePresets[0];

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
    () => createBadgeScene(activePreset.palette.accentAlt ?? "#2D7FF9", animate),
    [activePreset.palette.accentAlt, animate],
  );

  const svgPreview = useMemo(() => {
    const svg = renderFlatSceneToSvg(showcaseScene, {
      width: 800,
      height: 480,
    });

    return svg.length > 440 ? `${svg.slice(0, 440)}...` : svg;
  }, [showcaseScene]);

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
                Compose scenes from the packaged figure helpers and swap between
                bobbing, drift, and pulse motion presets.
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
