import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  FlatSvgSceneEditor,
  createFlatBadgeFigure,
  createFlatCardFigure,
  createFlatCloudFigure,
  createFlatSparkleFigure,
  createFlatSunFigure,
  setFlatNodeMotion,
  type FlatDesignScene,
} from "@moritzbrantner/flat-design";
import { Button } from "@moritzbrantner/ui";

import "./styles.css";

function createDemoScene(): FlatDesignScene {
  let scene: FlatDesignScene = {
    width: 720,
    height: 420,
    title: "Launch Illustration",
    background: "#f5f8ff",
    description: "Interactive flat-design GitHub Pages demo.",
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

function App() {
  const [scene, setScene] = useState<FlatDesignScene>(() => createDemoScene());

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1600px] p-4 md:p-8">
      <header className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            @moritzbrantner/flat-design
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Flat design editor</h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground md:text-base">
            Edit typed SVG scene data directly in the browser. Move, resize, rotate, group, layer,
            animate, import supported SVG, and export deterministic static or animated SVG output.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => setScene(createDemoScene())}>
            Reset demo
          </Button>
          <Button asChild variant="outline">
            <a
              href="https://github.com/moritzbrantner/platform-packages/tree/main/packages/flat-design"
              rel="noreferrer"
              target="_blank"
            >
              View source
            </a>
          </Button>
        </div>
      </header>

      <p className="mb-5 border-y py-3 text-sm leading-6 text-muted-foreground">
        This is the package-backed GitHub Pages acceptance surface. Changes here exercise the same
        document, motion, sampling, SVG interchange, and workbench boundaries published by the
        package.
      </p>

      <section className="min-w-0" aria-label="Flat design editor demo">
        <FlatSvgSceneEditor scene={scene} onSceneChange={setScene} />
      </section>
    </main>
  );
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Could not find #root.");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
