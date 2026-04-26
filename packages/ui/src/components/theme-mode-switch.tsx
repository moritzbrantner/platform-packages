"use client";

import * as React from "react";

import { cn } from "../lib/cn";

export type ThemeMode = "light" | "dark";

type ThemeModeSwitchProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "children" | "defaultValue" | "onChange" | "value"
> & {
  mode?: ThemeMode;
  defaultMode?: ThemeMode;
  onModeChange?: (mode: ThemeMode) => void;
  lightLabel?: string;
  darkLabel?: string;
};

function SunGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M12.6 3.4l-.9.9M4.3 11.7l-.9.9" />
    </svg>
  );
}

function MoonGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={className} fill="currentColor">
      <path d="M12.9 10.4A5.7 5.7 0 0 1 5.6 3.1a.45.45 0 0 0-.5-.64 6.1 6.1 0 1 0 8.44 8.44.45.45 0 0 0-.64-.5Z" />
    </svg>
  );
}

function ThemeModeSwitch({
  mode,
  defaultMode = "light",
  onModeChange,
  lightLabel = "Light mode",
  darkLabel = "Dark mode",
  className,
  disabled,
  onClick,
  type = "button",
  "aria-label": ariaLabel = "Color mode",
  ...props
}: ThemeModeSwitchProps) {
  const [internalMode, setInternalMode] = React.useState<ThemeMode>(defaultMode);
  const currentMode = mode ?? internalMode;
  const checked = currentMode === "dark";

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);

      if (event.defaultPrevented || disabled) {
        return;
      }

      const nextMode: ThemeMode = checked ? "light" : "dark";

      if (mode === undefined) {
        setInternalMode(nextMode);
      }

      onModeChange?.(nextMode);
    },
    [checked, disabled, mode, onClick, onModeChange],
  );

  return (
    <button
      type={type}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-description={checked ? darkLabel : lightLabel}
      data-slot="theme-mode-switch"
      data-mode={currentMode}
      disabled={disabled}
      className={cn(
        "group/theme-mode-switch relative isolate inline-flex h-10 w-20 shrink-0 items-center overflow-hidden rounded-full border border-cyan-200/80 bg-sky-200 p-1 text-slate-950 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.65),0_16px_34px_-24px_rgb(14_116_144_/_0.72)] transition-[background-color,border-color,box-shadow,filter] duration-300 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[mode=dark]:border-indigo-400/35 data-[mode=dark]:bg-slate-950 data-[mode=dark]:text-slate-50 data-[mode=dark]:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12),0_18px_38px_-24px_rgb(79_70_229_/_0.88)]",
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-1 top-1 h-4 rounded-full bg-white/45 blur-[1px] transition-opacity duration-300 group-data-[mode=dark]/theme-mode-switch:opacity-0"
      />
      <span
        aria-hidden="true"
        className="absolute left-3 top-2 size-1 rounded-full bg-white/95 opacity-0 shadow-[10px_4px_0_-1px_rgb(255_255_255_/_0.75),-7px_11px_0_-1px_rgb(255_255_255_/_0.72)] transition-opacity duration-300 group-data-[mode=dark]/theme-mode-switch:opacity-100"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-1 left-2 h-2 w-10 rounded-full bg-emerald-300/70 transition-[opacity,transform] duration-300 group-data-[mode=dark]/theme-mode-switch:translate-y-3 group-data-[mode=dark]/theme-mode-switch:opacity-0"
      />
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 grid size-8 place-items-center rounded-full bg-amber-300 text-amber-950 shadow-[0_8px_18px_-10px_rgb(146_64_14_/_0.65),inset_0_1px_0_rgb(255_255_255_/_0.65)] transition-transform duration-300 group-data-[mode=dark]/theme-mode-switch:translate-x-10 group-data-[mode=dark]/theme-mode-switch:bg-indigo-200 group-data-[mode=dark]/theme-mode-switch:text-indigo-950 group-data-[mode=dark]/theme-mode-switch:shadow-[0_8px_18px_-10px_rgb(67_56_202_/_0.75),inset_-5px_0_0_rgb(129_140_248_/_0.42)]"
      >
        <SunGlyph className="size-4 transition-all duration-300 group-data-[mode=dark]/theme-mode-switch:scale-0 group-data-[mode=dark]/theme-mode-switch:rotate-90" />
        <MoonGlyph className="absolute size-4 scale-0 transition-all duration-300 group-data-[mode=dark]/theme-mode-switch:scale-100 group-data-[mode=dark]/theme-mode-switch:rotate-0" />
      </span>
      <span
        aria-hidden="true"
        className="absolute left-11 top-1/2 size-2 -translate-y-1/2 rounded-full bg-white/80 shadow-[6px_0_0_-2px_rgb(255_255_255_/_0.8),11px_0_0_-3px_rgb(255_255_255_/_0.75)] transition-opacity duration-300 group-data-[mode=dark]/theme-mode-switch:opacity-0"
      />
      <span
        aria-hidden="true"
        className="absolute left-3 top-1/2 h-px w-8 -translate-y-1/2 bg-indigo-200/0 transition-colors duration-300 group-data-[mode=dark]/theme-mode-switch:bg-indigo-200/40"
      />
    </button>
  );
}

export { ThemeModeSwitch };
export type { ThemeModeSwitchProps };
