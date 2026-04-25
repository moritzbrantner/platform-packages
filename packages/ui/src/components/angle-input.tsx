"use client";

import * as React from "react";
import { RotateCcwIcon } from "lucide-react";

import { cn } from "../lib/cn";
import { Button } from "./button";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "./input-group";

const FULL_ROTATION = 360;
const DIAL_RADIUS = 42;
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS;

type AngleInputProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  id?: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  name?: string;
  step?: number;
  nudgeStep?: number;
  disabled?: boolean;
  dialAriaLabel?: string;
  inputAriaLabel?: string;
};

function clampStep(step: number | undefined) {
  const normalized = Math.abs(step ?? 1);

  if (!Number.isFinite(normalized) || normalized <= 0 || normalized >= FULL_ROTATION) {
    return 1;
  }

  return normalized;
}

function getStepPrecision(step: number) {
  const stepString = String(step);

  if (stepString.includes("e-")) {
    return Number(stepString.split("e-")[1] ?? 0);
  }

  return stepString.split(".")[1]?.length ?? 0;
}

function roundToPrecision(value: number, precision: number) {
  return Number(value.toFixed(precision));
}

function normalizeAngle(value: number, precision: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const normalized = ((value % FULL_ROTATION) + FULL_ROTATION) % FULL_ROTATION;
  return roundToPrecision(normalized, precision);
}

function snapAngle(value: number, step: number, precision: number) {
  return normalizeAngle(Math.round(value / step) * step, precision);
}

function formatAngle(value: number, precision: number) {
  return roundToPrecision(value, precision)
    .toFixed(precision)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
}

function getPointForAngle(angle: number, radius: number) {
  const radians = ((angle - 90) * Math.PI) / 180;

  return {
    x: 50 + Math.cos(radians) * radius,
    y: 50 + Math.sin(radians) * radius,
  };
}

function getAngleFromPointer(clientX: number, clientY: number, rect: DOMRect, precision: number) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const radians = Math.atan2(clientY - centerY, clientX - centerX);

  return normalizeAngle((radians * 180) / Math.PI + 90, precision + 2);
}

function AngleInput({
  id,
  value,
  defaultValue = 0,
  onValueChange,
  name,
  step = 1,
  nudgeStep = 45,
  disabled = false,
  dialAriaLabel = "Angle",
  inputAriaLabel = "Angle value",
  className,
  ...props
}: AngleInputProps) {
  const safeStep = React.useMemo(() => clampStep(step), [step]);
  const safeNudgeStep = React.useMemo(() => clampStep(nudgeStep), [nudgeStep]);
  const precision = React.useMemo(
    () => Math.max(getStepPrecision(safeStep), getStepPrecision(safeNudgeStep)),
    [safeNudgeStep, safeStep],
  );
  const [internalValue, setInternalValue] = React.useState(() =>
    snapAngle(defaultValue, safeStep, precision),
  );
  const [draftValue, setDraftValue] = React.useState<string | null>(null);
  const [activePointerId, setActivePointerId] = React.useState<number | null>(null);
  const dialRef = React.useRef<HTMLDivElement>(null);
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const currentAngle = value !== undefined ? snapAngle(value, safeStep, precision) : internalValue;
  const formattedAngle = formatAngle(currentAngle, precision);
  const nudgeLabel = formatAngle(safeNudgeStep, precision);
  const maximumAngle = roundToPrecision(FULL_ROTATION - safeStep, precision);
  const arcOffset =
    currentAngle === 0
      ? DIAL_CIRCUMFERENCE
      : DIAL_CIRCUMFERENCE * (1 - currentAngle / FULL_ROTATION);
  const indicator = getPointForAngle(currentAngle, DIAL_RADIUS);

  React.useEffect(() => {
    if (value === undefined) {
      setInternalValue((previousValue) => snapAngle(previousValue, safeStep, precision));
    }
  }, [precision, safeStep, value]);

  const commitValue = React.useCallback(
    (nextValue: number) => {
      if (disabled || !Number.isFinite(nextValue)) {
        return;
      }

      const normalizedValue = snapAngle(nextValue, safeStep, precision);

      if (value === undefined) {
        setInternalValue(normalizedValue);
      }

      onValueChange?.(normalizedValue);
    },
    [disabled, onValueChange, precision, safeStep, value],
  );

  const updateValueFromPointer = React.useCallback(
    (clientX: number, clientY: number) => {
      const rect = dialRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      commitValue(getAngleFromPointer(clientX, clientY, rect, precision));
    },
    [commitValue, precision],
  );

  const commitDraftValue = React.useCallback(() => {
    if (draftValue === null) {
      return;
    }

    const trimmed = draftValue.trim();

    if (trimmed !== "") {
      const parsed = Number(trimmed);

      if (Number.isFinite(parsed)) {
        commitValue(parsed);
      }
    }

    setDraftValue(null);
  }, [commitValue, draftValue]);

  const handleDialKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      switch (event.key) {
        case "ArrowRight":
        case "ArrowUp":
          event.preventDefault();
          commitValue(currentAngle + safeStep);
          break;
        case "ArrowLeft":
        case "ArrowDown":
          event.preventDefault();
          commitValue(currentAngle - safeStep);
          break;
        case "PageUp":
          event.preventDefault();
          commitValue(currentAngle + safeNudgeStep);
          break;
        case "PageDown":
          event.preventDefault();
          commitValue(currentAngle - safeNudgeStep);
          break;
        case "Home":
          event.preventDefault();
          commitValue(0);
          break;
        case "End":
          event.preventDefault();
          commitValue(maximumAngle);
          break;
        default:
          break;
      }
    },
    [commitValue, currentAngle, disabled, maximumAngle, safeNudgeStep, safeStep],
  );

  return (
    <div
      data-slot="angle-input"
      data-disabled={disabled ? true : undefined}
      className={cn(
        "grid min-w-0 gap-4 rounded-xl border border-border/60 bg-card/65 p-4 text-card-foreground shadow-xs supports-backdrop-filter:backdrop-blur-xl sm:grid-cols-[auto_minmax(0,1fr)]",
        className,
      )}
      {...props}
    >
      {name ? <input type="hidden" name={name} value={formattedAngle} /> : null}
      <div className="flex items-center justify-center">
        <div
          ref={dialRef}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={dialAriaLabel}
          aria-disabled={disabled}
          aria-valuemin={0}
          aria-valuemax={maximumAngle}
          aria-valuenow={currentAngle}
          aria-valuetext={`${formattedAngle} degrees`}
          data-slot="angle-input-dial"
          className={cn(
            "group/angle-input-dial relative grid size-40 touch-none place-items-center rounded-full border border-border/70 bg-[radial-gradient(circle_at_30%_30%,color-mix(in_oklch,var(--background)_96%,white),color-mix(in_oklch,var(--muted)_70%,transparent))] outline-none transition-[border-color,box-shadow,transform] duration-150",
            "shadow-[inset_0_1px_0_rgb(255_255_255_/_0.6),0_18px_36px_-26px_rgb(15_23_42_/_0.45)]",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50",
          )}
          data-disabled={disabled ? true : undefined}
          onKeyDown={handleDialKeyDown}
          onPointerDown={(event) => {
            if (disabled) {
              return;
            }

            event.preventDefault();
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture?.(event.pointerId);
            setActivePointerId(event.pointerId);
            updateValueFromPointer(event.clientX, event.clientY);
          }}
          onPointerMove={(event) => {
            if (activePointerId !== event.pointerId) {
              return;
            }

            updateValueFromPointer(event.clientX, event.clientY);
          }}
          onPointerUp={(event) => {
            if (activePointerId !== event.pointerId) {
              return;
            }

            event.currentTarget.releasePointerCapture?.(event.pointerId);
            setActivePointerId(null);
          }}
          onLostPointerCapture={() => setActivePointerId(null)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 size-full"
            fill="none"
          >
            {Array.from({ length: 24 }, (_, index) => {
              const angle = index * 15;
              const start = getPointForAngle(angle, index % 6 === 0 ? 31 : 35);
              const end = getPointForAngle(angle, 38);

              return (
                <line
                  key={angle}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  className="stroke-border/65"
                  strokeWidth={index % 6 === 0 ? 2.4 : 1.4}
                  strokeLinecap="round"
                />
              );
            })}
            <circle
              cx="50"
              cy="50"
              r={DIAL_RADIUS}
              className="stroke-border/55"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r={DIAL_RADIUS}
              className="stroke-primary transition-[stroke-dashoffset,opacity] duration-150"
              strokeWidth="6"
              strokeDasharray={DIAL_CIRCUMFERENCE}
              strokeDashoffset={arcOffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              opacity={currentAngle === 0 ? 0 : 1}
            />
            <line
              x1="50"
              y1="50"
              x2={indicator.x}
              y2={indicator.y}
              className="stroke-primary/80"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <circle
              cx={indicator.x}
              cy={indicator.y}
              r="4.5"
              className="fill-primary stroke-background"
              strokeWidth="2.2"
            />
          </svg>
          <div
            data-slot="angle-input-center"
            className="relative z-10 grid size-20 place-items-center rounded-full border border-border/70 bg-background/88 text-center shadow-[inset_0_1px_0_rgb(255_255_255_/_0.7),0_10px_20px_-16px_rgb(15_23_42_/_0.45)] supports-backdrop-filter:backdrop-blur"
          >
            <div className="grid gap-0.5">
              <span className="text-[10px] font-medium tracking-[0.24em] text-muted-foreground uppercase">
                Angle
              </span>
              <span className="text-lg font-semibold tabular-nums text-foreground">{formattedAngle}°</span>
            </div>
          </div>
        </div>
      </div>
      <div data-slot="angle-input-controls" className="grid min-w-0 content-center gap-3">
        <InputGroup>
          <InputGroupInput
            id={inputId}
            type="number"
            inputMode="decimal"
            step={safeStep}
            value={draftValue ?? formattedAngle}
            aria-label={inputAriaLabel}
            disabled={disabled}
            onChange={(event) => {
              const nextDraftValue = event.currentTarget.value;

              setDraftValue(nextDraftValue);

              if (nextDraftValue.trim() === "") {
                return;
              }

              const parsedValue = Number(nextDraftValue);

              if (Number.isFinite(parsedValue)) {
                commitValue(parsedValue);
              }
            }}
            onBlur={commitDraftValue}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitDraftValue();
                event.currentTarget.blur();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                setDraftValue(null);
                event.currentTarget.blur();
              }
            }}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>deg</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-label={`Decrease angle by ${nudgeLabel} degrees`}
            onClick={() => commitValue(currentAngle - safeNudgeStep)}
          >
            -{nudgeLabel}°
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-label="Reset angle"
            onClick={() => commitValue(0)}
          >
            <RotateCcwIcon />
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-label={`Increase angle by ${nudgeLabel} degrees`}
            onClick={() => commitValue(currentAngle + safeNudgeStep)}
          >
            +{nudgeLabel}°
          </Button>
        </div>
      </div>
    </div>
  );
}

export { AngleInput };
export type { AngleInputProps };
