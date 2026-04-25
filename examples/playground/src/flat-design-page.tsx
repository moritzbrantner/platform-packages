import { useState } from "react";

import {
  FlatSceneEditor,
  createFlatBadgeFigure,
  createFlatCardFigure,
  createFlatCloudFigure,
  createFlatSparkleFigure,
  setFlatNodeMotion,
  createFlatSunFigure,
  type FlatDesignScene,
} from "@moritzbrantner/flat-design";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";

function createEditorDemoScene(): FlatDesignScene {
  let scene: FlatDesignScene = {
    width: 720,
    height: 420,
    title: "Launch Illustration",
    background: "#f5f8ff",
    description: "Package-backed SVG scene editor demo.",
    layers: [
      {
        id: "foreground",
        shapes: [
          createFlatSunFigure({
            id: "hero-sun",
            x: 118,
            y: 92,
            radius: 34,
            color: "#ffc95c",
            haloColor: "#ffd782",
          }),
          createFlatCloudFigure({
            id: "hero-cloud",
            x: 226,
            y: 116,
            scale: 1.08,
          }),
          createFlatCardFigure({
            id: "hero-card",
            x: 362,
            y: 222,
            width: 232,
            height: 148,
            surface: "#ffffff",
            accent: "#2d7ff9",
            detail: "#c5d4ff",
          }),
          createFlatBadgeFigure({
            id: "hero-badge",
            x: 564,
            y: 146,
            scale: 0.62,
            color: "#2d7ff9",
          }),
          createFlatSparkleFigure({
            id: "hero-sparkle",
            x: 560,
            y: 278,
            size: 16,
            color: "#ffb347",
          }),
        ],
      },
    ],
  };

  scene = setFlatNodeMotion(
    scene,
    { layerIndex: 0, path: [0] },
    { kind: "preset", preset: "pulse" },
  );
  scene = setFlatNodeMotion(
    scene,
    { layerIndex: 0, path: [1] },
    { kind: "preset", preset: "drift" },
  );
  scene = setFlatNodeMotion(
    scene,
    { layerIndex: 0, path: [4] },
    { kind: "preset", preset: "blink" },
  );

  return scene;
}

export function FlatDesignPlaygroundPage() {
  const [scene, setScene] = useState<FlatDesignScene>(() => createEditorDemoScene());

  return (
    <PlaygroundPage
      activePage="flat-design"
      title="Flat design editor"
      description="The playground now consumes the package-backed `FlatSceneEditor` instead of implementing scene editing logic locally."
    >
      <div className="space-y-6">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/85 shadow-lg shadow-black/5">
          <CardHeader className="space-y-3">
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              @moritzbrantner/flat-design
            </Badge>
            <div className="space-y-2">
              <CardTitle className="text-2xl">Scene-native SVG editor</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6">
                Edit a typed `FlatDesignScene`, add packaged figure nodes, adjust safe node
                properties, switch between preset and timeline motion, and export raw SVG from the
                same scene object.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <FlatSceneEditor scene={scene} onSceneChange={setScene} showExportPanel />
          </CardContent>
        </Card>
      </div>
    </PlaygroundPage>
  );
}
