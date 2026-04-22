"use client";

import * as React from "react";

import { cn } from "../lib/cn";
import { Switch } from "./switch";

type ToggleSettingProps = Omit<React.ComponentProps<"div">, "title"> & {
  id?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  detail?: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  switchProps?: Omit<
    React.ComponentProps<typeof Switch>,
    "id" | "checked" | "defaultChecked" | "disabled" | "onCheckedChange"
  >;
};

function ToggleSetting({
  id,
  title,
  description,
  detail,
  checked,
  defaultChecked,
  disabled,
  onCheckedChange,
  switchProps,
  className,
  ...props
}: ToggleSettingProps) {
  const generatedId = React.useId();
  const switchId = id ?? generatedId;
  const descriptionId = description ? `${switchId}-description` : undefined;

  return (
    <div
      data-slot="toggle-setting"
      data-disabled={disabled ? true : undefined}
      className={cn(
        "group/toggle-setting grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border/60 bg-card/65 p-3 text-card-foreground shadow-xs supports-backdrop-filter:backdrop-blur-xl",
        className,
      )}
      {...props}
    >
      <div data-slot="toggle-setting-content" className="grid min-w-0 gap-1">
        <label
          data-slot="toggle-setting-title"
          htmlFor={switchId}
          className="text-sm font-medium leading-snug text-foreground group-data-[disabled=true]/toggle-setting:opacity-50"
        >
          {title}
        </label>
        {description && (
          <p
            id={descriptionId}
            data-slot="toggle-setting-description"
            className="text-sm leading-normal text-muted-foreground"
          >
            {description}
          </p>
        )}
        {detail && (
          <div data-slot="toggle-setting-detail" className="text-xs text-muted-foreground">
            {detail}
          </div>
        )}
      </div>
      <Switch
        id={switchId}
        aria-describedby={descriptionId}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        {...switchProps}
      />
    </div>
  );
}

export { ToggleSetting };
export type { ToggleSettingProps };
