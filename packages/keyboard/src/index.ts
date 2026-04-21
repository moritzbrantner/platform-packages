export type KeyboardPlatform = "auto" | "linux" | "mac" | "windows";

export type KeyboardModifier = "alt" | "ctrl" | "meta" | "mod" | "shift";

export type NormalizedKeyboardModifier = Exclude<KeyboardModifier, "mod">;

export type KeyboardShortcut = {
  allowInEditable?: boolean;
  key: string;
  modifiers?: readonly KeyboardModifier[];
};

export type NormalizedKeyboardShortcut = {
  allowInEditable: boolean;
  key: string;
  modifiers: readonly NormalizedKeyboardModifier[];
};

export type KeyboardShortcutEvent = {
  altKey?: boolean;
  ctrlKey?: boolean;
  defaultPrevented?: boolean;
  key: string;
  metaKey?: boolean;
  shiftKey?: boolean;
  target?: EventTarget | null;
  preventDefault?: () => void;
};

export type KeyboardShortcutCommand = {
  enabled?: boolean;
  handler: (event: KeyboardShortcutEvent) => void;
  id: string;
  preventDefault?: boolean;
  priority?: number;
  scope?: string;
  shortcut: KeyboardShortcut | string;
};

export type KeyboardShortcutRegistryOptions = {
  platform?: KeyboardPlatform;
  scope?: string;
};

export type RegisteredKeyboardShortcutCommand = KeyboardShortcutCommand & {
  normalizedShortcut: NormalizedKeyboardShortcut;
};

export type KeyboardShortcutRegistry = {
  getCommands(): RegisteredKeyboardShortcutCommand[];
  handleEvent(event: KeyboardShortcutEvent): boolean;
  register(command: KeyboardShortcutCommand): () => void;
  setScope(scope: string): void;
  unregister(commandId: string): void;
};

const MODIFIER_ORDER: readonly NormalizedKeyboardModifier[] = [
  "ctrl",
  "alt",
  "shift",
  "meta",
];

const KEY_ALIASES = new Map([
  [" ", "space"],
  ["arrowdown", "down"],
  ["arrowleft", "left"],
  ["arrowright", "right"],
  ["arrowup", "up"],
  ["esc", "escape"],
  ["return", "enter"],
]);

export function parseKeyboardShortcut(value: string): KeyboardShortcut {
  const parts = value
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  const key = parts.pop();

  if (!key) {
    throw new Error("Keyboard shortcut must include a key.");
  }

  return {
    key,
    modifiers: parts.map(parseKeyboardModifier),
  };
}

export function normalizeKeyboardShortcut(
  shortcut: KeyboardShortcut | string,
  platform: KeyboardPlatform = "auto",
): NormalizedKeyboardShortcut {
  const parsedShortcut = typeof shortcut === "string" ? parseKeyboardShortcut(shortcut) : shortcut;
  const resolvedPlatform = resolveKeyboardPlatform(platform);
  const modifiers = new Set<NormalizedKeyboardModifier>();

  for (const modifier of parsedShortcut.modifiers ?? []) {
    if (modifier === "mod") {
      modifiers.add(resolvedPlatform === "mac" ? "meta" : "ctrl");
      continue;
    }

    modifiers.add(modifier);
  }

  return {
    allowInEditable: parsedShortcut.allowInEditable ?? false,
    key: normalizeShortcutKey(parsedShortcut.key),
    modifiers: MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier)),
  };
}

export function matchesKeyboardShortcut(
  event: KeyboardShortcutEvent,
  shortcut: KeyboardShortcut | string,
  platform: KeyboardPlatform = "auto",
): boolean {
  const normalizedShortcut = normalizeKeyboardShortcut(shortcut, platform);

  if (
    event.defaultPrevented ||
    (!normalizedShortcut.allowInEditable && isEditableKeyboardTarget(event.target))
  ) {
    return false;
  }

  return (
    normalizeShortcutKey(event.key) === normalizedShortcut.key &&
    Boolean(event.altKey) === normalizedShortcut.modifiers.includes("alt") &&
    Boolean(event.ctrlKey) === normalizedShortcut.modifiers.includes("ctrl") &&
    Boolean(event.metaKey) === normalizedShortcut.modifiers.includes("meta") &&
    Boolean(event.shiftKey) === normalizedShortcut.modifiers.includes("shift")
  );
}

export function formatKeyboardShortcut(
  shortcut: KeyboardShortcut | string,
  platform: KeyboardPlatform = "auto",
): string {
  const resolvedPlatform = resolveKeyboardPlatform(platform);
  const normalizedShortcut = normalizeKeyboardShortcut(shortcut, resolvedPlatform);
  const labels = normalizedShortcut.modifiers.map((modifier) =>
    formatKeyboardModifier(modifier, resolvedPlatform),
  );

  labels.push(formatKeyboardKey(normalizedShortcut.key));
  return resolvedPlatform === "mac" ? labels.join("") : labels.join("+");
}

export function createKeyboardShortcutRegistry(
  options: KeyboardShortcutRegistryOptions = {},
): KeyboardShortcutRegistry {
  const platform = options.platform ?? "auto";
  const commands = new Map<string, RegisteredKeyboardShortcutCommand>();
  let activeScope = options.scope ?? "default";

  function sortedCommands() {
    return Array.from(commands.values()).sort(
      (left, right) =>
        (right.priority ?? 0) - (left.priority ?? 0) || left.id.localeCompare(right.id),
    );
  }

  return {
    getCommands() {
      return sortedCommands();
    },

    handleEvent(event) {
      for (const command of sortedCommands()) {
        if (command.enabled === false || (command.scope ?? "default") !== activeScope) {
          continue;
        }

        if (!matchesKeyboardShortcut(event, command.normalizedShortcut, platform)) {
          continue;
        }

        if (command.preventDefault !== false) {
          event.preventDefault?.();
        }

        command.handler(event);
        return true;
      }

      return false;
    },

    register(command) {
      const registeredCommand: RegisteredKeyboardShortcutCommand = {
        ...command,
        normalizedShortcut: normalizeKeyboardShortcut(command.shortcut, platform),
      };

      commands.set(command.id, registeredCommand);

      return () => {
        commands.delete(command.id);
      };
    },

    setScope(scope) {
      activeScope = scope;
    },

    unregister(commandId) {
      commands.delete(commandId);
    },
  };
}

export function isEditableKeyboardTarget(target: EventTarget | null | undefined): boolean {
  if (!target || !("nodeType" in target)) {
    return false;
  }

  const element = target as Element;
  const tagName = "tagName" in element ? element.tagName.toLocaleLowerCase() : "";

  return (
    tagName === "input" ||
    tagName === "select" ||
    tagName === "textarea" ||
    element.getAttribute?.("contenteditable") === "true" ||
    element.getAttribute?.("role") === "textbox"
  );
}

export function resolveKeyboardPlatform(platform: KeyboardPlatform = "auto"): Exclude<
  KeyboardPlatform,
  "auto"
> {
  if (platform !== "auto") {
    return platform;
  }

  const navigatorPlatform = globalThis.navigator?.platform.toLocaleLowerCase() ?? "";

  if (navigatorPlatform.includes("mac") || navigatorPlatform.includes("iphone")) {
    return "mac";
  }

  if (navigatorPlatform.includes("win")) {
    return "windows";
  }

  return "linux";
}

function parseKeyboardModifier(value: string): KeyboardModifier {
  const normalized = value.toLocaleLowerCase();

  if (
    normalized === "alt" ||
    normalized === "ctrl" ||
    normalized === "control" ||
    normalized === "cmd" ||
    normalized === "command" ||
    normalized === "meta" ||
    normalized === "mod" ||
    normalized === "shift"
  ) {
    if (normalized === "control") {
      return "ctrl";
    }

    if (normalized === "cmd" || normalized === "command") {
      return "meta";
    }

    return normalized;
  }

  throw new Error(`Unknown keyboard modifier: ${value}`);
}

function normalizeShortcutKey(key: string) {
  const normalized = key.toLocaleLowerCase();

  return KEY_ALIASES.get(normalized) ?? normalized;
}

function formatKeyboardModifier(
  modifier: NormalizedKeyboardModifier,
  platform: Exclude<KeyboardPlatform, "auto">,
) {
  if (platform === "mac") {
    switch (modifier) {
      case "alt":
        return "Option";
      case "ctrl":
        return "Control";
      case "meta":
        return "Command";
      case "shift":
        return "Shift";
    }
  }

  return modifier === "meta"
    ? "Meta"
    : modifier.charAt(0).toLocaleUpperCase() + modifier.slice(1);
}

function formatKeyboardKey(key: string) {
  return key.length === 1 ? key.toLocaleUpperCase() : key.charAt(0).toLocaleUpperCase() + key.slice(1);
}
