"use client";

import * as React from "react";
import { SearchIcon, XIcon } from "lucide-react";

import { cn } from "../lib/cn";
import { Button } from "./button";
import { Input } from "./input";
import { Kbd } from "./kbd";
import { Spinner } from "./spinner";

type SearchFieldProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onDebouncedValueChange?: (value: string) => void;
  debounceMs?: number;
  placeholder?: string;
  loading?: boolean;
  resultCount?: number;
  shortcut?: React.ReactNode;
  clearLabel?: string;
  inputProps?: Omit<React.ComponentProps<typeof Input>, "value" | "defaultValue" | "onChange">;
};

function SearchField({
  value,
  defaultValue = "",
  onValueChange,
  onDebouncedValueChange,
  debounceMs = 250,
  placeholder = "Search...",
  loading = false,
  resultCount,
  shortcut,
  clearLabel = "Clear search",
  inputProps,
  className,
  ...props
}: SearchFieldProps) {
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const searchValue = controlled ? value : internalValue;

  React.useEffect(() => {
    if (!onDebouncedValueChange) {
      return;
    }

    const timeout = window.setTimeout(() => {
      onDebouncedValueChange(searchValue);
    }, debounceMs);

    return () => window.clearTimeout(timeout);
  }, [debounceMs, onDebouncedValueChange, searchValue]);

  const setSearchValue = (nextValue: string) => {
    if (!controlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  return (
    <div
      data-slot="search-field"
      className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}
      {...props}
    >
      <div className="relative min-w-0 flex-1">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Search"
          placeholder={placeholder}
          {...inputProps}
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          className={cn("pr-16 pl-8", inputProps?.className)}
        />
        <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-1">
          {loading ? <Spinner decorative size="xs" variant="muted" /> : null}
          {searchValue ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={clearLabel}
              onClick={() => setSearchValue("")}
            >
              <XIcon />
            </Button>
          ) : null}
        </div>
      </div>
      {resultCount !== undefined ? (
        <span data-slot="search-field-result-count" className="text-xs text-muted-foreground">
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </span>
      ) : null}
      {shortcut ? (
        <Kbd data-slot="search-field-shortcut" className="shrink-0">
          {shortcut}
        </Kbd>
      ) : null}
    </div>
  );
}

export { SearchField, type SearchFieldProps };
