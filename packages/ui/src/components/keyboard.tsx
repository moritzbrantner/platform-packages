"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";
import type { HotkeyCombination, HotkeyModifier } from "./hotkey-visibility";

const keyboardVariants = cva(
  "inline-grid w-fit rounded-[calc(var(--radius)+0.5rem)] border border-border/60 bg-card/70 shadow-[var(--glass-shadow)] supports-backdrop-filter:backdrop-blur-xl",
  {
    variants: {
      size: {
        sm: "gap-1.5 p-2",
        default: "gap-2 p-3",
        lg: "gap-2.5 p-4",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const keyboardKeyVariants = cva(
  "relative flex min-w-10 flex-[var(--keyboard-key-span)] overflow-hidden rounded-[calc(var(--radius)+0.125rem)] border border-border/60 bg-background/85 text-foreground shadow-[var(--glass-interactive-shadow)] transition-[transform,background-color,color,border-color,box-shadow,opacity] duration-150 supports-backdrop-filter:backdrop-blur-xl data-[pressed=true]:translate-y-[1px] data-[pressed=true]:border-primary/45 data-[pressed=true]:bg-primary/10 data-[pressed=true]:shadow-[0_8px_18px_-14px_rgb(15_23_42_/_0.48)] data-[disabled=true]:opacity-45",
  {
    variants: {
      size: {
        sm: "min-h-9 min-w-9 px-2 py-1.5 text-[0.7rem]",
        default: "min-h-11 min-w-11 px-2.5 py-2 text-xs",
        lg: "min-h-12 min-w-12 px-3 py-2.5 text-sm",
      },
      tone: {
        default: "",
        muted: "bg-muted/70 text-muted-foreground",
        accent: "border-primary/25 bg-primary/8 text-primary",
        danger: "border-destructive/25 bg-destructive/8 text-destructive",
      },
      align: {
        start: "text-left",
        center: "text-center",
        end: "text-right",
      },
    },
    defaultVariants: {
      size: "default",
      tone: "default",
      align: "center",
    },
  },
);

type KeyboardSize = NonNullable<VariantProps<typeof keyboardVariants>["size"]>;
type KeyboardKeyTone = NonNullable<VariantProps<typeof keyboardKeyVariants>["tone"]>;
type KeyboardKeyAlign = NonNullable<VariantProps<typeof keyboardKeyVariants>["align"]>;
type KeyboardHotkeyModifier = Exclude<HotkeyModifier, "mod">;
type KeyboardHotkey = HotkeyCombination | readonly HotkeyCombination[];

type KeyboardKeyBaseProps = VariantProps<typeof keyboardKeyVariants> & {
  hint?: React.ReactNode;
  hotkey?: KeyboardHotkey;
  span?: number;
  pressed?: boolean;
};

type KeyboardKeyProps = React.ComponentProps<"button"> & KeyboardKeyBaseProps;

type KeyboardKeyDefinition = Omit<KeyboardKeyProps, "children"> & {
  label: React.ReactNode;
};

type KeyboardRowDefinition = {
  id?: string;
  keys: readonly KeyboardKeyDefinition[];
  className?: string;
};

type KeyboardContextValue = {
  size: KeyboardSize;
};

const KeyboardContext = React.createContext<KeyboardContextValue>({
  size: "default",
});

type KeyboardProps = React.ComponentProps<"div"> &
  VariantProps<typeof keyboardVariants> & {
    rows?: readonly KeyboardRowDefinition[];
  };

type NormalizedKeyboardHotkey = {
  key: string;
  modifiers: readonly KeyboardHotkeyModifier[] | null;
};

type PressedKeyboardState = {
  keys: ReadonlySet<string>;
  modifiers: Record<KeyboardHotkeyModifier, boolean>;
};

const keyboardModifierOrder: readonly KeyboardHotkeyModifier[] = ["ctrl", "alt", "shift", "meta"];
const emptyPressedKeyboardState: PressedKeyboardState = {
  keys: new Set<string>(),
  modifiers: {
    alt: false,
    ctrl: false,
    meta: false,
    shift: false,
  },
};
const inferredKeyboardHotkeys = new Map<string, readonly string[]>([
  ["alt", ["Alt"]],
  ["backspace", ["Backspace"]],
  ["caps", ["CapsLock"]],
  ["caps lock", ["CapsLock"]],
  ["capslock", ["CapsLock"]],
  ["cmd", ["Meta"]],
  ["command", ["Meta"]],
  ["control", ["Control"]],
  ["ctrl", ["Control"]],
  ["del", ["Delete", "Backspace"]],
  ["delete", ["Delete", "Backspace"]],
  ["down", ["ArrowDown"]],
  ["enter", ["Enter"]],
  ["esc", ["Escape"]],
  ["escape", ["Escape"]],
  ["left", ["ArrowLeft"]],
  ["meta", ["Meta"]],
  ["option", ["Alt"]],
  ["return", ["Enter"]],
  ["right", ["ArrowRight"]],
  ["shift", ["Shift"]],
  ["space", ["Space"]],
  ["spacebar", ["Space"]],
  ["tab", ["Tab"]],
  ["up", ["ArrowUp"]],
]);

let pressedKeyboardState = emptyPressedKeyboardState;
let isListeningForPressedKeyboardState = false;
const pressedKeyboardStateListeners = new Set<() => void>();

function Keyboard({
  className,
  size,
  rows,
  children,
  ...props
}: KeyboardProps) {
  const resolvedSize = size ?? "default";

  return (
    <KeyboardContext.Provider value={{ size: resolvedSize }}>
      <div
        data-slot="keyboard"
        data-size={resolvedSize}
        className={cn(keyboardVariants({ size: resolvedSize }), className)}
        {...props}
      >
        {rows
          ? rows.map((row, rowIndex) => (
              <KeyboardRow key={row.id ?? rowIndex} className={row.className}>
                {row.keys.map(({ label, ...key }, keyIndex) => (
                  <KeyboardKey
                    key={key.id ?? keyIndex}
                    {...key}
                  >
                    {label}
                  </KeyboardKey>
                ))}
              </KeyboardRow>
            ))
          : children}
      </div>
    </KeyboardContext.Provider>
  );
}

function KeyboardRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="keyboard-row" className={cn("flex items-stretch gap-2", className)} {...props} />
  );
}

function KeyboardKey({
  className,
  children,
  hint,
  hotkey,
  span = 1,
  tone = "default",
  align = "center",
  pressed = false,
  disabled = false,
  style,
  type = "button",
  ...props
}: KeyboardKeyProps) {
  const { size } = React.useContext(KeyboardContext);
  const resolvedHotkeys = React.useMemo(
    () => normalizeKeyboardHotkeys(hotkey ?? inferKeyboardHotkeys(children, hint)),
    [children, hint, hotkey],
  );
  const pressedState = React.useSyncExternalStore(
    subscribePressedKeyboardState,
    getPressedKeyboardState,
    getServerPressedKeyboardState,
  );
  const hotkeyPressed = resolvedHotkeys.some((candidate) => isKeyboardHotkeyPressed(candidate, pressedState));
  const wasHotkeyPressedRef = React.useRef(hotkeyPressed);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const normalizedSpan = Number.isFinite(span) && span > 0 ? span : 1;
  const keyboardKeyStyle = {
    ...style,
    "--keyboard-key-span": String(normalizedSpan),
  } as React.CSSProperties;
  const isCentered = align === "center";
  const resolvedPressed = pressed || hotkeyPressed;
  const resolvedAriaKeyShortcuts = props["aria-keyshortcuts"] ?? formatKeyboardHotkeys(resolvedHotkeys);

  React.useEffect(() => {
    if (hotkeyPressed && !wasHotkeyPressedRef.current && !disabled) {
      buttonRef.current?.click();
    }

    wasHotkeyPressedRef.current = hotkeyPressed;
  }, [disabled, hotkeyPressed]);

  return (
    <button
      ref={buttonRef}
      data-slot="keyboard-key"
      data-align={align}
      data-disabled={disabled ? true : undefined}
      data-pressed={resolvedPressed ? true : undefined}
      data-tone={tone}
      aria-keyshortcuts={resolvedAriaKeyShortcuts}
      className={cn(keyboardKeyVariants({ align, size, tone }), className)}
      disabled={disabled}
      style={keyboardKeyStyle}
      type={type}
      {...props}
    >
      <div
        className={cn(
          "flex h-full w-full flex-col gap-1",
          hint ? "justify-between" : "justify-center",
          align === "start" && "items-start",
          isCentered && "items-center",
          align === "end" && "items-end",
        )}
      >
        {hint ? (
          <span
            data-slot="keyboard-key-hint"
            className={cn(
              "text-[0.7em] font-medium tracking-[0.16em] text-muted-foreground uppercase",
              align === "start" && "self-start",
              isCentered && "self-end",
              align === "end" && "self-end",
            )}
          >
            {hint}
          </span>
        ) : null}
        <span
          data-slot="keyboard-key-label"
          className={cn("w-full truncate font-medium leading-none", isCentered && "text-center")}
        >
          {children}
        </span>
      </div>
    </button>
  );
}

export { Keyboard, KeyboardKey, KeyboardRow };
export type {
  KeyboardKeyAlign,
  KeyboardKeyDefinition,
  KeyboardHotkey,
  KeyboardKeyProps,
  KeyboardKeyTone,
  KeyboardProps,
  KeyboardRowDefinition,
  KeyboardSize,
};

function subscribePressedKeyboardState(listener: () => void) {
  pressedKeyboardStateListeners.add(listener);
  startPressedKeyboardStateListeners();

  return () => {
    pressedKeyboardStateListeners.delete(listener);
    stopPressedKeyboardStateListeners();
  };
}

function getPressedKeyboardState() {
  return pressedKeyboardState;
}

function getServerPressedKeyboardState() {
  return emptyPressedKeyboardState;
}

function startPressedKeyboardStateListeners() {
  if (isListeningForPressedKeyboardState || typeof window === "undefined") {
    return;
  }

  window.addEventListener("keydown", handlePressedKeyboardEvent, true);
  window.addEventListener("keyup", handlePressedKeyboardEvent, true);
  window.addEventListener("blur", resetPressedKeyboardState);
  document.addEventListener("visibilitychange", handlePressedKeyboardVisibilityChange);
  isListeningForPressedKeyboardState = true;
}

function stopPressedKeyboardStateListeners() {
  if (pressedKeyboardStateListeners.size > 0 || !isListeningForPressedKeyboardState || typeof window === "undefined") {
    return;
  }

  window.removeEventListener("keydown", handlePressedKeyboardEvent, true);
  window.removeEventListener("keyup", handlePressedKeyboardEvent, true);
  window.removeEventListener("blur", resetPressedKeyboardState);
  document.removeEventListener("visibilitychange", handlePressedKeyboardVisibilityChange);
  isListeningForPressedKeyboardState = false;
  pressedKeyboardState = emptyPressedKeyboardState;
}

function handlePressedKeyboardEvent(event: KeyboardEvent) {
  const normalizedKey = normalizeKeyboardEventKey(event.key);
  const nextKeys = new Set(pressedKeyboardState.keys);

  if (normalizedKey) {
    if (event.type === "keydown") {
      nextKeys.add(normalizedKey);
    } else {
      nextKeys.delete(normalizedKey);
    }
  }

  updatePressedKeyboardState({
    keys: nextKeys,
    modifiers: getPressedKeyboardModifiersFromEvent(event),
  });
}

function handlePressedKeyboardVisibilityChange() {
  if (document.visibilityState === "hidden") {
    resetPressedKeyboardState();
  }
}

function resetPressedKeyboardState() {
  updatePressedKeyboardState(emptyPressedKeyboardState);
}

function updatePressedKeyboardState(nextState: PressedKeyboardState) {
  if (
    pressedKeyboardState.modifiers.alt === nextState.modifiers.alt &&
    pressedKeyboardState.modifiers.ctrl === nextState.modifiers.ctrl &&
    pressedKeyboardState.modifiers.meta === nextState.modifiers.meta &&
    pressedKeyboardState.modifiers.shift === nextState.modifiers.shift &&
    arePressedKeyboardKeysEqual(pressedKeyboardState.keys, nextState.keys)
  ) {
    return;
  }

  pressedKeyboardState = nextState;
  pressedKeyboardStateListeners.forEach((listener) => listener());
}

function arePressedKeyboardKeysEqual(left: ReadonlySet<string>, right: ReadonlySet<string>) {
  if (left.size !== right.size) {
    return false;
  }

  for (const key of left) {
    if (!right.has(key)) {
      return false;
    }
  }

  return true;
}

function getPressedKeyboardModifiersFromEvent(event: KeyboardEvent) {
  return {
    alt: event.altKey,
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    shift: event.shiftKey,
  };
}

function normalizeKeyboardHotkeys(hotkey: KeyboardHotkey | undefined) {
  if (!hotkey) {
    return [];
  }

  const candidates = Array.isArray(hotkey) ? hotkey : [hotkey];
  const normalizedCandidates = new Map<string, NormalizedKeyboardHotkey>();

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeKeyboardHotkey(candidate);

    if (!normalizedCandidate) {
      continue;
    }

    normalizedCandidates.set(getNormalizedKeyboardHotkeyId(normalizedCandidate), normalizedCandidate);
  }

  return [...normalizedCandidates.values()];
}

function normalizeKeyboardHotkey(hotkey: HotkeyCombination): NormalizedKeyboardHotkey | null {
  if (typeof hotkey === "string") {
    return parseKeyboardHotkeyString(hotkey);
  }

  const normalizedKey = normalizeKeyboardEventKey(hotkey.key);

  if (!normalizedKey) {
    return null;
  }

  const normalizedModifiers = normalizeKeyboardHotkeyModifiers(hotkey.modifiers ?? []);

  return {
    key: normalizedKey,
    modifiers: hotkey.modifiers?.length ? normalizedModifiers : null,
  };
}

function parseKeyboardHotkeyString(value: string): NormalizedKeyboardHotkey | null {
  const parts = value
    .trim()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  if (parts.length > 1) {
    const normalizedKey = normalizeKeyboardEventKey(parts.at(-1) ?? "");

    if (!normalizedKey) {
      return null;
    }

    return {
      key: normalizedKey,
      modifiers: normalizeKeyboardHotkeyModifiers(parts.slice(0, -1)),
    };
  }

  const normalizedKey = normalizeKeyboardEventKey(parts[0]);

  if (!normalizedKey) {
    return null;
  }

  return {
    key: normalizedKey,
    modifiers: null,
  };
}

function normalizeKeyboardHotkeyModifiers(modifiers: readonly string[]) {
  const normalizedModifiers = new Set<KeyboardHotkeyModifier>();
  const platform = resolveKeyboardHotkeyPlatform();

  for (const modifier of modifiers) {
    const normalizedModifier = normalizeKeyboardHotkeyModifier(modifier);

    if (!normalizedModifier) {
      continue;
    }

    normalizedModifiers.add(
      normalizedModifier === "mod" ? (platform === "mac" ? "meta" : "ctrl") : normalizedModifier,
    );
  }

  return keyboardModifierOrder.filter((modifier) => normalizedModifiers.has(modifier));
}

function normalizeKeyboardHotkeyModifier(value: string): HotkeyModifier | null {
  const normalizedValue = value.toLocaleLowerCase();

  if (normalizedValue === "control") {
    return "ctrl";
  }

  if (normalizedValue === "cmd" || normalizedValue === "command") {
    return "meta";
  }

  if (normalizedValue === "option") {
    return "alt";
  }

  if (
    normalizedValue === "alt" ||
    normalizedValue === "ctrl" ||
    normalizedValue === "meta" ||
    normalizedValue === "mod" ||
    normalizedValue === "shift"
  ) {
    return normalizedValue;
  }

  return null;
}

function normalizeKeyboardEventKey(key: string) {
  if (key === " ") {
    return "space";
  }

  const normalizedKey = key.trim().toLocaleLowerCase();

  if (!normalizedKey) {
    return null;
  }

  if (normalizedKey === "arrowdown" || normalizedKey === "down") {
    return "down";
  }

  if (normalizedKey === "arrowleft" || normalizedKey === "left") {
    return "left";
  }

  if (normalizedKey === "arrowright" || normalizedKey === "right") {
    return "right";
  }

  if (normalizedKey === "arrowup" || normalizedKey === "up") {
    return "up";
  }

  if (normalizedKey === "caps" || normalizedKey === "capslock") {
    return "capslock";
  }

  if (normalizedKey === "cmd" || normalizedKey === "command") {
    return "meta";
  }

  if (normalizedKey === "control") {
    return "ctrl";
  }

  if (normalizedKey === "esc") {
    return "escape";
  }

  if (normalizedKey === "option") {
    return "alt";
  }

  if (normalizedKey === "return") {
    return "enter";
  }

  return normalizedKey;
}

function isKeyboardModifier(value: string): value is KeyboardHotkeyModifier {
  return value === "alt" || value === "ctrl" || value === "meta" || value === "shift";
}

function inferKeyboardHotkeys(label: React.ReactNode, hint?: React.ReactNode) {
  const candidates = [getKeyboardText(label), getKeyboardText(hint)].filter((value): value is string => Boolean(value));

  if (candidates.length === 0) {
    return undefined;
  }

  const inferredCandidates = candidates.flatMap((candidate) => {
    const normalizedCandidate = candidate.trim().toLocaleLowerCase();
    return inferredKeyboardHotkeys.get(normalizedCandidate) ?? [candidate];
  });

  return inferredCandidates.length > 0 ? inferredCandidates : undefined;
}

function getKeyboardText(content: React.ReactNode): string | null {
  if (typeof content === "string" || typeof content === "number") {
    return String(content);
  }

  const childArray = React.Children.toArray(content);

  if (
    childArray.length === 0 ||
    childArray.some((child) => typeof child !== "string" && typeof child !== "number")
  ) {
    return null;
  }

  return childArray.join("");
}

function isKeyboardHotkeyPressed(hotkey: NormalizedKeyboardHotkey, state: PressedKeyboardState) {
  if (!state.keys.has(hotkey.key)) {
    return false;
  }

  if (hotkey.modifiers === null) {
    return true;
  }

  const modifiers = hotkey.modifiers;

  return keyboardModifierOrder.every((modifier) => modifiers.includes(modifier) === state.modifiers[modifier]);
}

function getNormalizedKeyboardHotkeyId(hotkey: NormalizedKeyboardHotkey) {
  return `${hotkey.modifiers?.join("+") ?? "*"}:${hotkey.key}`;
}

function formatKeyboardHotkeys(hotkeys: readonly NormalizedKeyboardHotkey[]) {
  if (hotkeys.length === 0) {
    return undefined;
  }

  return hotkeys
    .map((hotkey) => {
      const labels = hotkey.modifiers?.map(formatKeyboardHotkeyModifierLabel) ?? [];
      labels.push(formatKeyboardHotkeyKeyLabel(hotkey.key));
      return labels.join("+");
    })
    .join(" ");
}

function formatKeyboardHotkeyModifierLabel(modifier: KeyboardHotkeyModifier) {
  return modifier === "meta" ? "Meta" : modifier.charAt(0).toLocaleUpperCase() + modifier.slice(1);
}

function formatKeyboardHotkeyKeyLabel(key: string) {
  if (key === "space") {
    return "Space";
  }

  if (key.length === 1) {
    return key.toLocaleUpperCase();
  }

  return key.charAt(0).toLocaleUpperCase() + key.slice(1);
}

function resolveKeyboardHotkeyPlatform(): "linux" | "mac" | "windows" {
  const navigatorPlatform = globalThis.navigator?.platform.toLocaleLowerCase() ?? "";

  if (navigatorPlatform.includes("mac") || navigatorPlatform.includes("iphone")) {
    return "mac";
  }

  if (navigatorPlatform.includes("win")) {
    return "windows";
  }

  return "linux";
}
