"use client";

import { useId, useRef, useState } from "react";

import { Button, Input, Label } from "@moritzbrantner/ui";

import { FlatSceneEditor, type FlatSceneEditorProps } from "./editor";
import {
  importFlatSceneFromSvg,
  renderFlatSceneAnimationToSvg,
  renderFlatSceneFrameToSvg,
  type FlatSvgImportIssue,
} from "./svg-interchange";
import type { FlatDesignScene } from "./scene-types";

export type FlatSvgSceneEditorProps = Omit<FlatSceneEditorProps, "onSceneChange"> & {
  onSceneChange: (scene: FlatDesignScene) => void;
  exportFileName?: string;
  initialFrameTimeMs?: number;
  onSvgImportIssues?: (issues: FlatSvgImportIssue[]) => void;
};

/**
 * FlatSceneEditor with a file-oriented SVG interchange toolbar.
 *
 * Imported SVG is converted to FlatDesignScene data before editing; raw markup,
 * scripts, and unsupported foreign content are never inserted into the editor.
 */
export function FlatSvgSceneEditor({
  scene,
  onSceneChange,
  exportFileName,
  initialFrameTimeMs = 0,
  onSvgImportIssues,
  readOnly = false,
  ...editorProps
}: FlatSvgSceneEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const frameTimeInputId = useId();
  const [frameTimeMs, setFrameTimeMs] = useState(initialFrameTimeMs);
  const [importIssues, setImportIssues] = useState<FlatSvgImportIssue[]>([]);
  const [importError, setImportError] = useState<string>();

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const result = importFlatSceneFromSvg(await file.text());
      setImportError(undefined);
      setImportIssues(result.issues);
      onSvgImportIssues?.(result.issues);
      onSceneChange(result.scene);
    } catch (error) {
      setImportIssues([]);
      onSvgImportIssues?.([]);
      setImportError(error instanceof Error ? error.message : "SVG import failed.");
    }
  }

  function handleDownloadFrame() {
    const markup = renderFlatSceneFrameToSvg(scene, frameTimeMs, {
      width: scene.width,
      height: scene.height,
    });
    downloadSvg(createFrameFileName(resolveFileName(scene, exportFileName), frameTimeMs), markup);
  }

  function handleDownloadAnimation() {
    const markup = renderFlatSceneAnimationToSvg(scene, {
      width: scene.width,
      height: scene.height,
    });
    downloadSvg(`${resolveFileName(scene, exportFileName)}.svg`, markup);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border/60 bg-background/70 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="hidden"
          disabled={readOnly}
          onChange={handleImportFile}
        />
        <Button type="button" disabled={readOnly} onClick={() => fileInputRef.current?.click()}>
          Import SVG
        </Button>
        <div className="grid gap-1">
          <Label htmlFor={frameTimeInputId}>Frame time (ms)</Label>
          <Input
            id={frameTimeInputId}
            type="number"
            min={0}
            step={100}
            value={String(frameTimeMs)}
            onChange={(event) => {
              const nextTime = Number(event.target.value);
              setFrameTimeMs(Number.isFinite(nextTime) ? Math.max(0, nextTime) : 0);
            }}
          />
        </div>
        <Button type="button" variant="outline" onClick={handleDownloadFrame}>
          Export frame SVG
        </Button>
        <Button type="button" variant="outline" onClick={handleDownloadAnimation}>
          Export animated SVG
        </Button>
      </div>

      {importError ? (
        <p role="alert" className="text-sm text-destructive">
          {importError}
        </p>
      ) : null}

      {importIssues.length > 0 ? (
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <div className="font-medium text-foreground">SVG imported with compatibility notes</div>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {importIssues.slice(0, 4).map((issue, index) => (
              <li key={`${issue.code}-${issue.element ?? "svg"}-${issue.id ?? index}`}>
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <FlatSceneEditor
        {...editorProps}
        scene={scene}
        readOnly={readOnly}
        onSceneChange={onSceneChange}
      />
    </div>
  );
}

function resolveFileName(scene: FlatDesignScene, explicitFileName?: string) {
  const source = explicitFileName ?? scene.title ?? "flat-scene";
  const withoutExtension = source.replace(/\.svg$/i, "");
  const normalized = withoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "flat-scene";
}

function createFrameFileName(baseName: string, timeInMs: number) {
  const normalizedTime = Number.isFinite(timeInMs) ? Math.max(0, Math.round(timeInMs)) : 0;
  return `${baseName}-frame-${normalizedTime}ms.svg`;
}

function downloadSvg(fileName: string, markup: string) {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    return;
  }

  const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
