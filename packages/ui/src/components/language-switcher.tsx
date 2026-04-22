"use client";

import * as React from "react";

import { cn } from "../lib/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export type LanguageSwitcherLanguage = {
  value: string;
  label: string;
  flag: React.ReactNode;
  disabled?: boolean;
};

type LanguageSwitcherProps = Omit<React.ComponentProps<typeof DropdownMenu>, "children"> & {
  languages?: readonly LanguageSwitcherLanguage[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, language: LanguageSwitcherLanguage) => void;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  align?: React.ComponentProps<typeof DropdownMenuContent>["align"];
  sideOffset?: React.ComponentProps<typeof DropdownMenuContent>["sideOffset"];
  placeholder?: string;
  "aria-label"?: string;
};

function UnitedStatesFlagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 18" className="size-full overflow-hidden rounded-[2px]">
      <rect width="24" height="18" fill="#f8fafc" />
      <path
        fill="#dc2626"
        d="M0 0h24v2H0V0Zm0 4h24v2H0V4Zm0 4h24v2H0V8Zm0 4h24v2H0v-2Zm0 4h24v2H0v-2Z"
      />
      <rect width="10.5" height="10" fill="#1d4ed8" />
    </svg>
  );
}

function GermanyFlagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 18" className="size-full overflow-hidden rounded-[2px]">
      <rect width="24" height="6" fill="#18181b" />
      <rect y="6" width="24" height="6" fill="#dc2626" />
      <rect y="12" width="24" height="6" fill="#facc15" />
    </svg>
  );
}

function FranceFlagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 18" className="size-full overflow-hidden rounded-[2px]">
      <rect width="8" height="18" fill="#2563eb" />
      <rect x="8" width="8" height="18" fill="#f8fafc" />
      <rect x="16" width="8" height="18" fill="#dc2626" />
    </svg>
  );
}

function SpainFlagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 18" className="size-full overflow-hidden rounded-[2px]">
      <rect width="24" height="18" fill="#facc15" />
      <rect width="24" height="4.5" fill="#dc2626" />
      <rect y="13.5" width="24" height="4.5" fill="#dc2626" />
    </svg>
  );
}

function GlobeFallbackIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2 2.3 3 5.1 3 8.5s-1 6.2-3 8.5M12 3.5c-2 2.3-3 5.1-3 8.5s1 6.2 3 8.5" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    >
      <path d="M4 6 8 10l4-4" />
    </svg>
  );
}

const defaultLanguageSwitcherLanguages = [
  { value: "en", label: "English", flag: <UnitedStatesFlagIcon /> },
  { value: "de", label: "Deutsch", flag: <GermanyFlagIcon /> },
  { value: "fr", label: "Francais", flag: <FranceFlagIcon /> },
  { value: "es", label: "Espanol", flag: <SpainFlagIcon /> },
] as const satisfies readonly LanguageSwitcherLanguage[];

function LanguageSwitcher({
  languages = defaultLanguageSwitcherLanguages,
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  className,
  contentClassName,
  align = "end",
  sideOffset = 6,
  placeholder = "Select language",
  "aria-label": ariaLabel = "Language",
  ...props
}: LanguageSwitcherProps) {
  const firstAvailableLanguage = React.useMemo(
    () => languages.find((language) => !language.disabled),
    [languages],
  );
  const [internalValue, setInternalValue] = React.useState(
    () => defaultValue ?? firstAvailableLanguage?.value ?? "",
  );
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const currentValue = value ?? internalValue;
  const selectedLanguage =
    languages.find((language) => language.value === currentValue) ?? firstAvailableLanguage;
  const menuOpen = open ?? internalOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (open === undefined) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [onOpenChange, open],
  );

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      const nextLanguage = languages.find((language) => language.value === nextValue);

      if (!nextLanguage || nextLanguage.disabled) {
        return;
      }

      if (value === undefined) {
        setInternalValue(nextValue);
      }

      onValueChange?.(nextValue, nextLanguage);
    },
    [languages, onValueChange, value],
  );

  const triggerLabel = selectedLanguage ? `${ariaLabel}: ${selectedLanguage.label}` : placeholder;

  return (
    <DropdownMenu open={menuOpen} onOpenChange={handleOpenChange} {...props}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          data-slot="language-switcher"
          data-open={menuOpen ? true : undefined}
          disabled={disabled || !firstAvailableLanguage}
          className={cn(
            "group/language-switcher inline-flex h-10 w-14 shrink-0 items-center justify-center gap-1 rounded-md border border-border bg-background text-foreground shadow-[0_10px_24px_-18px_rgb(15_23_42_/_0.42)] transition-[background-color,border-color,box-shadow,transform] duration-150 outline-none hover:-translate-y-[1px] hover:border-primary/35 hover:bg-accent/45 hover:shadow-[0_16px_30px_-20px_rgb(15_23_42_/_0.5)] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[open=true]:border-primary/45 data-[open=true]:bg-accent data-[open=true]:shadow-[0_16px_30px_-20px_rgb(15_23_42_/_0.5)] dark:bg-input/30 dark:hover:bg-input/50",
            className,
          )}
        >
          <span
            aria-hidden="true"
            data-slot="language-switcher-flag"
            className="grid size-6 place-items-center overflow-hidden rounded-[3px] ring-1 ring-foreground/10"
          >
            {selectedLanguage?.flag ?? <GlobeFallbackIcon />}
          </span>
          <ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform duration-150 group-data-[open=true]/language-switcher:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        sideOffset={sideOffset}
        className={cn("w-auto min-w-44 p-1.5", contentClassName)}
      >
        <DropdownMenuRadioGroup
          value={selectedLanguage?.value ?? ""}
          onValueChange={handleValueChange}
        >
          {languages.map((language) => (
            <DropdownMenuRadioItem
              key={language.value}
              value={language.value}
              disabled={language.disabled}
              className="min-h-9 gap-2.5 py-1.5 pr-8 pl-2 data-[state=checked]:bg-accent/70"
            >
              <span
                aria-hidden="true"
                className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-[3px] ring-1 ring-foreground/10"
              >
                {language.flag}
              </span>
              <span className="min-w-0 truncate font-medium">{language.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { LanguageSwitcher, defaultLanguageSwitcherLanguages };
export type { LanguageSwitcherProps };
