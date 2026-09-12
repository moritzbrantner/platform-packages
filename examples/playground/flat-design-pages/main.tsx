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
    <main className="pages-shell">
      <header className="pages-header">
        <div>
          <p className="pages-eyebrow">@moritzbrantner/flat-design</p>
          <h1>Flat design editor</h1>
          <p className="pages-description">
            Edit typed SVG scene data directly in the browser. Move, resize, rotate, group, layer,
            animate, import supported SVG, and export deterministic static or animated SVG output.
          </p>
        </div>
        <div className="pages-actions">
          <Button type="button" variant="outline" onClick={() => setScene(createDemoScene())}>
            Reset demo
          </Button>
          <a
            href="https://github.com/moritzbrantner/platform-packages/tree/main/packages/flat-design"
            rel="noreferrer"
            target="_blank"
          >
            View source
          </a>
        </div>
      </header>

      <p className="pages-note">
        This is the package-backed GitHub Pages acceptance surface. Changes here exercise the same
        document, motion, sampling, SVG interchange, and workbench boundaries published by the
        package.
      </p>

      <section className="editor-surface" aria-label="Flat design editor demo">
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
