import * as React from "react";

export type HotkeyModifier = "alt" | "ctrl" | "meta" | "mod" | "shift";

export type HotkeyCombination =
  | string
  | {
      key: string;
      modifiers?: readonly HotkeyModifier[];
    };

export type HotkeyHintProps = {
  /**
   * Hotkey used for visibility matching. If children are omitted, this value is
   * also formatted as the visible label.
   */
  shortcut?: HotkeyCombination;
  /**
   * Keep the shortcut visible regardless of pressed modifiers.
   */
  alwaysShowShortcut?: boolean;
};

type NormalizedHotkeyModifier = Exclude<HotkeyModifier, "mod">;

type ModifierState = Record<NormalizedHotkeyModifier, boolean>;

type NormalizedHotkeyCombination = {
  key: string;
  modifiers: readonly NormalizedHotkeyModifier[];
};

const modifierOrder: readonly NormalizedHotkeyModifier[] = ["ctrl", "alt", "shift", "meta"];

const emptyModifierState: ModifierState = {
  alt: false,
  ctrl: false,
  meta: false,
  shift: false,
};

const displayModifierPatterns: Array<[NormalizedHotkeyModifier, RegExp]> = [
  ["meta", /(?:⌘|\b(?:cmd|command|meta)\b)/i],
  ["ctrl", /(?:⌃|\b(?:ctrl|control)\b)/i],
  ["alt", /(?:⌥|\b(?:alt|option)\b)/i],
  ["shift", /(?:⇧|\bshift\b)/i],
];

const keyAliases = new Map([
  [" ", "space"],
  ["arrowdown", "down"],
  ["arrowleft", "left"],
  ["arrowright", "right"],
  ["arrowup", "up"],
  ["esc", "escape"],
  ["return", "enter"],
]);

let modifierState = emptyModifierState;
let isListening = false;
const modifierListeners = new Set<() => void>();

export function useHotkeyShortcut(
  shortcut: HotkeyCombination | undefined,
  children: React.ReactNode,
  alwaysShowShortcut = false,
) {
  const inferredShortcut = React.useMemo(
    () => normalizeHotkeyCombination(shortcut) ?? inferHotkeyCombination(children),
    [children, shortcut],
  );
  const pressedModifiers = React.useSyncExternalStore(
    subscribeModifierState,
    getModifierState,
    getServerModifierState,
  );

  if (alwaysShowShortcut || !inferredShortcut) {
    return {
      children: children ?? formatHotkeyCombination(shortcut),
      visible: true,
    };
  }

  const hasPressedModifier = modifierOrder.some((modifier) => pressedModifiers[modifier]);
  const hasShortcutModifier = inferredShortcut.modifiers.length > 0;
  const visible = hasShortcutModifier
    ? inferredShortcut.modifiers.every((modifier) => pressedModifiers[modifier])
    : !hasPressedModifier;

  return {
    children: children ?? formatNormalizedHotkeyCombination(inferredShortcut),
    visible,
  };
}

function subscribeModifierState(listener: () => void) {
  modifierListeners.add(listener);
  startModifierListeners();

  return () => {
    modifierListeners.delete(listener);
    stopModifierListeners();
  };
}

function getModifierState() {
  return modifierState;
}

function getServerModifierState() {
  return emptyModifierState;
}

function startModifierListeners() {
  if (isListening || typeof window === "undefined") {
    return;
  }

  window.addEventListener("keydown", handleModifierKeyEvent, true);
  window.addEventListener("keyup", handleModifierKeyEvent, true);
  window.addEventListener("blur", resetModifierState);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  isListening = true;
}

function stopModifierListeners() {
  if (modifierListeners.size > 0 || !isListening || typeof window === "undefined") {
    return;
  }

  window.removeEventListener("keydown", handleModifierKeyEvent, true);
  window.removeEventListener("keyup", handleModifierKeyEvent, true);
  window.removeEventListener("blur", resetModifierState);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  isListening = false;
  modifierState = emptyModifierState;
}

function handleModifierKeyEvent(event: KeyboardEvent) {
  updateModifierState(getModifierStateFromEvent(event));
}

function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    resetModifierState();
  }
}

function resetModifierState() {
  updateModifierState(emptyModifierState);
}

function updateModifierState(nextModifierState: ModifierState) {
  if (
    modifierState.alt === nextModifierState.alt &&
    modifierState.ctrl === nextModifierState.ctrl &&
    modifierState.meta === nextModifierState.meta &&
    modifierState.shift === nextModifierState.shift
  ) {
    return;
  }

  modifierState = nextModifierState;
  modifierListeners.forEach((listener) => listener());
}

function getModifierStateFromEvent(event: KeyboardEvent): ModifierState {
  const nextModifierState = {
    alt: event.altKey,
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    shift: event.shiftKey,
  };

  if (event.type === "keydown") {
    const modifier = normalizeModifierKey(event.key);

    if (modifier) {
      nextModifierState[modifier] = true;
    }
  }

  return nextModifierState;
}

function normalizeHotkeyCombination(
  shortcut: HotkeyCombination | undefined,
): NormalizedHotkeyCombination | null {
  if (!shortcut) {
    return null;
  }

  if (typeof shortcut === "string") {
    return parseHotkeyString(shortcut);
  }

  return {
    key: normalizeHotkeyKey(shortcut.key),
    modifiers: normalizeModifierList(shortcut.modifiers ?? []),
  };
}

function inferHotkeyCombination(children: React.ReactNode): NormalizedHotkeyCombination | null {
  const text = getTextChildren(children);

  if (!text) {
    return null;
  }

  return parseHotkeyString(text);
}

function parseHotkeyString(value: string): NormalizedHotkeyCombination {
  const trimmedValue = value.trim();
  const explicitParts = trimmedValue
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  if (explicitParts.length > 1) {
    const key = explicitParts.at(-1) ?? "";

    return {
      key: normalizeHotkeyKey(key),
      modifiers: normalizeModifierList(explicitParts.slice(0, -1)),
    };
  }

  return {
    key: normalizeHotkeyKey(stripDisplayModifiers(trimmedValue)),
    modifiers: inferDisplayModifiers(trimmedValue),
  };
}

function normalizeModifierList(modifiers: readonly string[]) {
  const normalizedModifiers = new Set<NormalizedHotkeyModifier>();
  const platform = resolveHotkeyPlatform();

  for (const modifier of modifiers) {
    const normalizedModifier = normalizeHotkeyModifier(modifier);

    if (!normalizedModifier) {
      continue;
    }

    normalizedModifiers.add(
      normalizedModifier === "mod" ? (platform === "mac" ? "meta" : "ctrl") : normalizedModifier,
    );
  }

  return modifierOrder.filter((modifier) => normalizedModifiers.has(modifier));
}

function inferDisplayModifiers(value: string) {
  const modifiers = new Set<NormalizedHotkeyModifier>();

  for (const [modifier, pattern] of displayModifierPatterns) {
    if (pattern.test(value)) {
      modifiers.add(modifier);
    }
  }

  return modifierOrder.filter((modifier) => modifiers.has(modifier));
}

function stripDisplayModifiers(value: string) {
  return value
    .replace(/[⌘⌃⌥⇧]/g, "")
    .replace(/\b(?:alt|cmd|command|control|ctrl|meta|option|shift)\b/gi, "")
    .trim();
}

function normalizeHotkeyModifier(value: string): HotkeyModifier | null {
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

function normalizeModifierKey(key: string): NormalizedHotkeyModifier | null {
  if (key === "Alt") {
    return "alt";
  }

  if (key === "Control") {
    return "ctrl";
  }

  if (key === "Meta") {
    return "meta";
  }

  if (key === "Shift") {
    return "shift";
  }

  return null;
}

function normalizeHotkeyKey(key: string) {
  const normalizedKey = key.toLocaleLowerCase();

  return keyAliases.get(normalizedKey) ?? normalizedKey;
}

function getTextChildren(children: React.ReactNode): string | null {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  const childArray = React.Children.toArray(children);

  if (
    childArray.length === 0 ||
    childArray.some((child) => typeof child !== "string" && typeof child !== "number")
  ) {
    return null;
  }

  return childArray.join("");
}

function formatHotkeyCombination(shortcut: HotkeyCombination | undefined) {
  const normalizedShortcut = normalizeHotkeyCombination(shortcut);

  return normalizedShortcut ? formatNormalizedHotkeyCombination(normalizedShortcut) : undefined;
}

function formatNormalizedHotkeyCombination(shortcut: NormalizedHotkeyCombination) {
  const platform = resolveHotkeyPlatform();
  const labels = shortcut.modifiers.map((modifier) => formatModifierLabel(modifier, platform));

  labels.push(formatKeyLabel(shortcut.key));

  return platform === "mac" ? labels.join("") : labels.join("+");
}

function formatModifierLabel(
  modifier: NormalizedHotkeyModifier,
  platform: "linux" | "mac" | "windows",
) {
  if (platform === "mac") {
    switch (modifier) {
      case "alt":
        return "⌥";
      case "ctrl":
        return "⌃";
      case "meta":
        return "⌘";
      case "shift":
        return "⇧";
    }
  }

  return modifier === "meta" ? "Meta" : modifier.charAt(0).toLocaleUpperCase() + modifier.slice(1);
}

function formatKeyLabel(key: string) {
  return key.length === 1
    ? key.toLocaleUpperCase()
    : key.charAt(0).toLocaleUpperCase() + key.slice(1);
}

function resolveHotkeyPlatform(): "linux" | "mac" | "windows" {
  const navigatorPlatform = globalThis.navigator?.platform.toLocaleLowerCase() ?? "";

  if (navigatorPlatform.includes("mac") || navigatorPlatform.includes("iphone")) {
    return "mac";
  }

  if (navigatorPlatform.includes("win")) {
    return "windows";
  }

  return "linux";
}
