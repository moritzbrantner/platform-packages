"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { cn } from "../lib/cn";

type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root> & {
  thumbAriaLabel?: string;
  thumbAriaLabelledBy?: string;
};

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  thumbAriaLabel,
  thumbAriaLabelledBy,
  ...props
}: SliderProps) {
  const rootAriaLabel = typeof props["aria-label"] === "string" ? props["aria-label"] : undefined;
  const _values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max],
  );
  const getThumbAriaLabel = (index: number) => {
    if (thumbAriaLabelledBy) {
      return undefined;
    }

    if (thumbAriaLabel) {
      return _values.length > 1 ? `${thumbAriaLabel} ${index + 1}` : thumbAriaLabel;
    }

    if (rootAriaLabel) {
      return _values.length > 1 ? `${rootAriaLabel} ${index + 1}` : `${rootAriaLabel} handle`;
    }

    return _values.length > 1 ? `Slider thumb ${index + 1}` : "Slider thumb";
  };

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-muted data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute bg-primary select-none data-horizontal:h-full data-vertical:w-full"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={getThumbAriaLabel(index)}
          aria-labelledby={thumbAriaLabelledBy}
          className="relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider, type SliderProps };
