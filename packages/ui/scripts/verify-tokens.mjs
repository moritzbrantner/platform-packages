import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tokenFiles = [
  "styles.css",
  "bobba/styles.css",
  "zleek/styles.css",
  "atlas/styles.css",
  "studio/styles.css",
  "paper/styles.css",
];
const errors = [];
const baseTokens = readTokens(path.join(packageRoot, "styles.css"));
const requiredTokens = intersection(baseTokens.root, baseTokens.dark);

for (const relativeFile of tokenFiles) {
  const filePath = path.join(packageRoot, relativeFile);
  const source = readFileSync(filePath, "utf8");
  const tokens = readTokens(filePath);

  if (
    tokens.root.size === 0 &&
    tokens.dark.size === 0 &&
    /^\s*@import\s+["']\.\.\/styles\.css["'];?\s*$/m.test(source)
  ) {
    continue;
  }

  for (const token of requiredTokens) {
    if (!tokens.root.has(token)) {
      errors.push(`${relativeFile}: :root is missing ${token}`);
    }

    if (!tokens.dark.has(token)) {
      errors.push(`${relativeFile}: .dark is missing ${token}`);
    }
  }
}

if (errors.length > 0) {
  console.error("@moritzbrantner/ui token verification failed:");

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exit(1);
}

console.log(`@moritzbrantner/ui token contract verified (${requiredTokens.length} shared tokens)`);

function readTokens(filePath) {
  const source = readFileSync(filePath, "utf8");

  return {
    root: extractCustomProperties(extractBlock(source, ":root")),
    dark: extractCustomProperties(extractBlock(source, ".dark")),
  };
}

function extractBlock(source, selector) {
  const selectorMatch = new RegExp(`(^|\\n)\\s*${escapeRegExp(selector)}\\s*\\{`, "m").exec(source);

  if (!selectorMatch || selectorMatch.index === undefined) {
    return "";
  }

  const selectorIndex = selectorMatch.index + selectorMatch[0].lastIndexOf(selector);
  const blockStart = source.indexOf("{", selectorIndex);

  if (blockStart === -1) {
    return "";
  }

  let depth = 0;

  for (let index = blockStart; index < source.length; index += 1) {
    const character = source[index];

    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(blockStart + 1, index);
      }
    }
  }

  return "";
}

function extractCustomProperties(block) {
  return new Set([...block.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1]));
}

function intersection(left, right) {
  return [...left].filter((value) => right.has(value)).sort((a, b) => a.localeCompare(b));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
