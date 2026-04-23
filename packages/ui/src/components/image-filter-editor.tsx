"use client";

import * as React from "react";
import { ImageIcon, RotateCcwIcon } from "lucide-react";

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

type ImageFilterEditorProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  alt?: string;
  defaultValue?: Partial<ImageFilterValue>;
  disabled?: boolean;
  emptyState?: React.ReactNode;
  onValueChange?: (value: ImageFilterValue) => void;
  presets?: ImageFilterPreset[];
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
  const currentValue = value ?? internalValue;
  const filter = getImageFilterStyle(currentValue);

  const commitValue = (nextValue: ImageFilterValue) => {
    const normalizedValue = normalizeImageFilterValue(nextValue);

    setInternalValue(normalizedValue);
    onValueChange?.(normalizedValue);
  };

  return (
    <div
      data-slot="image-filter-editor"
      className={cn("grid gap-4 rounded-lg border border-border/70 bg-card p-4", className)}
      {...props}
    >
      <div
        data-slot="image-filter-preview"
        className="grid aspect-video min-h-48 place-items-center overflow-hidden rounded-md border border-border/60 bg-muted/35"
      >
        {src ? (
          <img
            data-slot="image-filter-image"
            src={src}
            alt={alt}
            className="size-full object-contain"
            style={{ filter }}
          />
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
                {preset.label}
              </Button>
            );
          })}
        </div>
      ) : null}

      <div data-slot="image-filter-controls" className="grid gap-3">
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

      {showReset ? (
        <div className="flex justify-end">
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
        </div>
      ) : null}
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
