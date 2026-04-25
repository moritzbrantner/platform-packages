"use client";

import * as React from "react";
import { CheckIcon, EyeIcon, ImageIcon, RotateCcwIcon, SparklesIcon } from "lucide-react";

import { Badge } from "./badge";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { Label } from "./label";
import { Slider } from "./slider";

type ImageFilterValue = {
  brightness: number;
  contrast: number;
  grayscale: number;
  hueRotate: number;
  saturate: number;
  sepia: number;
};

type ImageFilterPreset = {
  id: string;
  label: string;
  value: ImageFilterValue;
};

type ImageFilterPreviewMode = "edited" | "split" | "original";

type ImageFilterEditorProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange" | "value"> & {
  alt?: string;
  defaultValue?: Partial<ImageFilterValue>;
  disabled?: boolean;
  emptyState?: React.ReactNode;
  onValueChange?: (value: ImageFilterValue) => void;
  presets?: ImageFilterPreset[];
  showCompare?: boolean;
  showPresets?: boolean;
  showReset?: boolean;
  src?: string | null;
  value?: ImageFilterValue;
};

const DEFAULT_IMAGE_FILTER_VALUE: ImageFilterValue = {
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  hueRotate: 0,
  saturate: 100,
  sepia: 0,
};

const imageFilterPresets: ImageFilterPreset[] = [
  {
    id: "original",
    label: "Original",
    value: DEFAULT_IMAGE_FILTER_VALUE,
  },
  {
    id: "vivid",
    label: "Vivid",
    value: {
      brightness: 106,
      contrast: 112,
      grayscale: 0,
      hueRotate: 0,
      saturate: 132,
      sepia: 0,
    },
  },
  {
    id: "mono",
    label: "Mono",
    value: {
      brightness: 102,
      contrast: 118,
      grayscale: 100,
      hueRotate: 0,
      saturate: 0,
      sepia: 0,
    },
  },
  {
    id: "warm",
    label: "Warm",
    value: {
      brightness: 104,
      contrast: 106,
      grayscale: 0,
      hueRotate: -8,
      saturate: 118,
      sepia: 18,
    },
  },
];

const imageFilterControls = [
  { key: "brightness", label: "Brightness", min: 0, max: 200, step: 1, suffix: "%" },
  { key: "contrast", label: "Contrast", min: 0, max: 200, step: 1, suffix: "%" },
  { key: "saturate", label: "Saturation", min: 0, max: 200, step: 1, suffix: "%" },
  { key: "grayscale", label: "Grayscale", min: 0, max: 100, step: 1, suffix: "%" },
  { key: "sepia", label: "Sepia", min: 0, max: 100, step: 1, suffix: "%" },
  { key: "hueRotate", label: "Hue", min: -180, max: 180, step: 1, suffix: "deg" },
] as const satisfies readonly {
  key: keyof ImageFilterValue;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
}[];

function ImageFilterEditor({
  alt = "",
  className,
  defaultValue,
  disabled = false,
  emptyState,
  onValueChange,
  presets = imageFilterPresets,
  showCompare = true,
  showPresets = true,
  showReset = true,
  src,
  value,
  ...props
}: ImageFilterEditorProps) {
  const controlIdPrefix = React.useId();
  const [internalValue, setInternalValue] = React.useState<ImageFilterValue>(() =>
    normalizeImageFilterValue(defaultValue),
  );
  const [previewMode, setPreviewMode] = React.useState<ImageFilterPreviewMode>("edited");
  const currentValue = value ?? internalValue;
  const filter = getImageFilterStyle(currentValue);
  const activePreset =
    presets.find((preset) => areImageFilterValuesEqual(currentValue, preset.value)) ?? null;
  const adjustmentCount = imageFilterControls.reduce((count, control) => {
    return currentValue[control.key] === DEFAULT_IMAGE_FILTER_VALUE[control.key] ? count : count + 1;
  }, 0);
  const statusLabel = activePreset?.label ?? (adjustmentCount > 0 ? "Custom mix" : "Original");
  const adjustmentLabel =
    adjustmentCount === 0
      ? "No active adjustments"
      : `${adjustmentCount} adjustment${adjustmentCount === 1 ? "" : "s"}`;

  const commitValue = (nextValue: ImageFilterValue) => {
    const normalizedValue = normalizeImageFilterValue(nextValue);

    setInternalValue(normalizedValue);
    onValueChange?.(normalizedValue);
  };

  const previewModeLabel =
    previewMode === "edited" ? "Edited" : previewMode === "split" ? "Compare" : "Original";

  return (
    <div
      data-slot="image-filter-editor"
      className={cn("grid gap-4 rounded-lg border border-border/70 bg-card p-4", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{statusLabel}</Badge>
          <Badge variant="outline">{adjustmentLabel}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showCompare && src ? (
            <>
              <Button
                type="button"
                size="xs"
                variant={previewMode === "edited" ? "secondary" : "outline"}
                aria-pressed={previewMode === "edited"}
                aria-label="Show edited preview"
                disabled={disabled}
                onClick={() => setPreviewMode("edited")}
              >
                <SparklesIcon />
                Edited
              </Button>
              <Button
                type="button"
                size="xs"
                variant={previewMode === "split" ? "secondary" : "outline"}
                aria-pressed={previewMode === "split"}
                aria-label="Show compare preview"
                disabled={disabled}
                onClick={() => setPreviewMode("split")}
              >
                <EyeIcon />
                Compare
              </Button>
              <Button
                type="button"
                size="xs"
                variant={previewMode === "original" ? "secondary" : "outline"}
                aria-pressed={previewMode === "original"}
                aria-label="Show original preview"
                disabled={disabled}
                onClick={() => setPreviewMode("original")}
              >
                <ImageIcon />
                Original
              </Button>
            </>
          ) : null}
          {showReset ? (
            <Button
              data-slot="image-filter-reset"
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => commitValue(DEFAULT_IMAGE_FILTER_VALUE)}
            >
              <RotateCcwIcon />
              Reset
            </Button>
          ) : null}
        </div>
      </div>

      <div
        data-slot="image-filter-preview"
        className="relative grid aspect-video min-h-48 place-items-center overflow-hidden rounded-md border border-border/60 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_58%),linear-gradient(135deg,rgba(15,23,42,0.06),rgba(15,23,42,0.16))]"
      >
        {src ? (
          <>
            <img
              data-slot="image-filter-image-base"
              src={src}
              alt={alt}
              className="absolute inset-0 size-full object-contain p-2"
            />
            {previewMode !== "original" ? (
              <img
                data-slot="image-filter-image"
                src={src}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 size-full object-contain p-2"
                style={{
                  clipPath: previewMode === "split" ? "inset(0 0 0 50%)" : undefined,
                  filter,
                }}
              />
            ) : null}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3">
              <Badge variant="outline">{previewModeLabel}</Badge>
              {previewMode === "split" ? (
                <Badge variant="secondary">Before / After</Badge>
              ) : null}
            </div>
            {previewMode === "split" ? (
              <>
                <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/85 shadow-[0_0_0_1px_rgba(15,23,42,0.18)]" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-3 text-xs font-medium text-white">
                  <span className="rounded-full bg-black/55 px-2 py-1">Original</span>
                  <span className="rounded-full bg-black/55 px-2 py-1">Edited</span>
                </div>
              </>
            ) : null}
          </>
        ) : (
          (emptyState ?? (
            <div className="grid place-items-center gap-2 px-4 text-center text-sm text-muted-foreground">
              <ImageIcon className="size-8" aria-hidden="true" />
              <span>No image selected</span>
            </div>
          ))
        )}
      </div>

      {showPresets && presets.length > 0 ? (
        <div data-slot="image-filter-presets" className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const selected = areImageFilterValuesEqual(currentValue, preset.value);

            return (
              <Button
                key={preset.id}
                type="button"
                size="sm"
                variant={selected ? "secondary" : "outline"}
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => commitValue(preset.value)}
              >
                {selected ? <CheckIcon /> : null}
                {preset.label}
              </Button>
            );
          })}
        </div>
      ) : null}

      <div data-slot="image-filter-controls" className="grid gap-3 md:grid-cols-2">
        {imageFilterControls.map((control) => {
          const controlId = `${controlIdPrefix}-${control.key}`;
          const displayValue = `${currentValue[control.key]}${control.suffix}`;

          return (
            <div key={control.key} data-slot="image-filter-control" className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label id={`${controlId}-label`}>{control.label}</Label>
                <span className="text-xs tabular-nums text-muted-foreground">{displayValue}</span>
              </div>
              <Slider
                aria-labelledby={`${controlId}-label`}
                disabled={disabled}
                max={control.max}
                min={control.min}
                step={control.step}
                thumbAriaLabelledBy={`${controlId}-label`}
                value={[currentValue[control.key]]}
                onValueChange={([nextControlValue]) =>
                  commitValue({
                    ...currentValue,
                    [control.key]: nextControlValue ?? currentValue[control.key],
                  })
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function normalizeImageFilterValue(value: Partial<ImageFilterValue> | null | undefined = {}) {
  const input = value ?? {};

  return {
    brightness: clampFilterNumber(input.brightness, 0, 200, DEFAULT_IMAGE_FILTER_VALUE.brightness),
    contrast: clampFilterNumber(input.contrast, 0, 200, DEFAULT_IMAGE_FILTER_VALUE.contrast),
    grayscale: clampFilterNumber(input.grayscale, 0, 100, DEFAULT_IMAGE_FILTER_VALUE.grayscale),
    hueRotate: clampFilterNumber(input.hueRotate, -180, 180, DEFAULT_IMAGE_FILTER_VALUE.hueRotate),
    saturate: clampFilterNumber(input.saturate, 0, 200, DEFAULT_IMAGE_FILTER_VALUE.saturate),
    sepia: clampFilterNumber(input.sepia, 0, 100, DEFAULT_IMAGE_FILTER_VALUE.sepia),
  };
}

function getImageFilterStyle(value: Partial<ImageFilterValue> | null | undefined = {}) {
  const normalizedValue = normalizeImageFilterValue(value);

  return [
    `brightness(${normalizedValue.brightness}%)`,
    `contrast(${normalizedValue.contrast}%)`,
    `saturate(${normalizedValue.saturate}%)`,
    `grayscale(${normalizedValue.grayscale}%)`,
    `sepia(${normalizedValue.sepia}%)`,
    `hue-rotate(${normalizedValue.hueRotate}deg)`,
  ].join(" ");
}

function areImageFilterValuesEqual(
  left: Partial<ImageFilterValue>,
  right: Partial<ImageFilterValue>,
) {
  const normalizedLeft = normalizeImageFilterValue(left);
  const normalizedRight = normalizeImageFilterValue(right);

  return imageFilterControls.every(
    (control) => normalizedLeft[control.key] === normalizedRight[control.key],
  );
}

function clampFilterNumber(
  value: number | null | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

export {
  DEFAULT_IMAGE_FILTER_VALUE,
  ImageFilterEditor,
  areImageFilterValuesEqual,
  getImageFilterStyle,
  imageFilterPresets,
  normalizeImageFilterValue,
  type ImageFilterEditorProps,
  type ImageFilterPreset,
  type ImageFilterValue,
};
