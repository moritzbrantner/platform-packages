# @moritzbrantner/keyboard

Cross-platform keyboard shortcut parsing, formatting, matching, and registry utilities.

## Main APIs

- `parseKeyboardShortcut(value)` / `normalizeKeyboardShortcut(shortcut, platform?)`
- `matchesKeyboardShortcut(event, shortcut, platform?)` / `formatKeyboardShortcut(shortcut, platform?)`
- `createKeyboardShortcutRegistry(options)`
