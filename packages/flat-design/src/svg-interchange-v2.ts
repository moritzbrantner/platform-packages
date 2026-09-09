import {
  FlatSvgImportError,
  importFlatSceneFromSvg as importFlatSceneFromSvgV1,
  renderFlatSceneAnimationToSvg,
  renderFlatSceneFrameToSvg,
  type FlatSvgImportIssue,
  type FlatSvgImportIssueCode,
  type FlatSvgImportResult,
  type ImportFlatSceneFromSvgOptions,
} from "./svg-interchange";
import type { FlatDesignScene, FlatShape, FlatText } from "./scene-types";

export {
  FlatSvgImportError,
  renderFlatSceneAnimationToSvg,
  renderFlatSceneFrameToSvg,
};
export type {
  FlatSvgImportIssue,
  FlatSvgImportIssueCode,
  FlatSvgImportResult,
  ImportFlatSceneFromSvgOptions,
};

type XmlElement = {
  name: string;
  attributes: Record<string, string>;
  children: XmlElement[];
  text: string[];
};

type TextPlaceholder = {
  placeholderId: string;
  originalId?: string;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  textAnchor?: "start" | "middle" | "end";
};

type PreparedTextImport = {
  markup: string;
  placeholders: Map<string, TextPlaceholder>;
  issues: FlatSvgImportIssue[];
};

const animationNames = new Set(["animate", "animateMotion", "animateTransform", "set"]);
const supportedTextStyleProperties = new Set([
  "font-family",
  "font-size",
  "font-weight",
  "text-anchor",
]);
const unsupportedTextAttributes = [
  "dx",
  "dy",
  "rotate",
  "textLength",
  "lengthAdjust",
  "dominant-baseline",
  "letter-spacing",
  "word-spacing",
  "text-decoration",
] as const;

/**
 * Import the v2 editable SVG subset.
 *
 * A3 remains authoritative for geometry, presentation, animation, security, and
 * compatibility diagnostics. Plain <text> nodes are rewritten to inert rect
 * placeholders before A3 parsing and restored in-place afterward. This keeps
 * tree ordering/group nesting identical without creating a second geometry
 * importer. Rich SVG text remains explicitly lossy.
 */
export function importFlatSceneFromSvg(
  svgMarkup: string,
  options: ImportFlatSceneFromSvgOptions = {},
): FlatSvgImportResult {
  const prepared = preparePlainTextImport(svgMarkup);
  const base = importFlatSceneFromSvgV1(prepared.markup, options);
  const scene = restoreTextPlaceholders(base.scene, prepared.placeholders);
  const issues = [...base.issues, ...prepared.issues];

  return {
    scene,
    issues,
    isLossless: issues.length === 0,
  };
}

function preparePlainTextImport(svgMarkup: string): PreparedTextImport {
  const root = parseXml(svgMarkup);
  const ids = new Set<string>();
  visitElements(root, (element) => {
    const id = element.attributes.id?.trim();
    if (id) ids.add(id);
  });

  const placeholders = new Map<string, TextPlaceholder>();
  const issues: FlatSvgImportIssue[] = [];
  let sequence = 1;

  function nextPlaceholderId() {
    let id = `__flat_design_text_${sequence}`;
    while (ids.has(id)) {
      sequence += 1;
      id = `__flat_design_text_${sequence}`;
    }
    sequence += 1;
    ids.add(id);
    return id;
  }

  function rewrite(element: XmlElement): XmlElement {
    if (localName(element.name) !== "text") {
      return {
        ...element,
        children: element.children.map(rewrite),
      };
    }

    const placeholderId = nextPlaceholderId();
    const style = parseStyle(element.attributes.style);
    const directText = normalizeSvgText(element.text.join(""));
    const richChildren = element.children.filter(
      (child) => !animationNames.has(localName(child.name)),
    );

    for (const child of richChildren) {
      issues.push({
        code: "unsupported-element",
        element: "text",
        id: element.attributes.id,
        message: `<${localName(child.name)}> inside <text> is outside the plain-text v2 subset and was skipped.`,
      });
    }

    for (const attribute of unsupportedTextAttributes) {
      if (element.attributes[attribute] !== undefined || style.has(attribute.toLowerCase())) {
        issues.push({
          code: "unsupported-presentation",
          element: "text",
          id: element.attributes.id,
          message: `${attribute} on <text> is outside the plain-text v2 subset and was not imported.`,
        });
      }
    }

    const fontSize = parseOptionalSvgNumber(
      style.get("font-size") ?? element.attributes["font-size"],
      "font-size",
      element,
      issues,
    );
    const fontFamily = nonBlank(style.get("font-family") ?? element.attributes["font-family"]);
    const fontWeight = parseFontWeight(
      style.get("font-weight") ?? element.attributes["font-weight"],
      element,
      issues,
    );
    const textAnchor = parseTextAnchor(
      style.get("text-anchor") ?? element.attributes["text-anchor"],
      element,
      issues,
    );

    placeholders.set(placeholderId, {
      placeholderId,
      originalId: element.attributes.id,
      text: directText,
      fontSize,
      fontFamily,
      fontWeight,
      textAnchor,
    });

    const attributes = { ...element.attributes };
    delete attributes.id;
    delete attributes["font-size"];
    delete attributes["font-family"];
    delete attributes["font-weight"];
    delete attributes["text-anchor"];
    for (const attribute of unsupportedTextAttributes) {
      delete attributes[attribute];
    }

    const filteredStyle = [...style.entries()]
      .filter(([property]) => !supportedTextStyleProperties.has(property))
      .map(([property, value]) => `${property}: ${value}`)
      .join("; ");
    if (filteredStyle) attributes.style = filteredStyle;
    else delete attributes.style;

    attributes.id = placeholderId;
    attributes.x = element.attributes.x ?? "0";
    attributes.y = element.attributes.y ?? "0";
    attributes.width = "0";
    attributes.height = "0";

    return {
      name: "rect",
      attributes,
      children: element.children
        .filter((child) => animationNames.has(localName(child.name)))
        .map(rewrite),
      text: [],
    };
  }

  return {
    markup: serializeXml(rewrite(root)),
    placeholders,
    issues,
  };
}

function restoreTextPlaceholders(
  scene: FlatDesignScene,
  placeholders: ReadonlyMap<string, TextPlaceholder>,
): FlatDesignScene {
  function restore(shape: FlatShape): FlatShape {
    if (shape.kind === "group") {
      return { ...shape, children: shape.children.map(restore) };
    }

    const placeholder = shape.id ? placeholders.get(shape.id) : undefined;
    if (!placeholder || shape.kind !== "rect") {
      return shape;
    }

    const text: FlatText = {
      kind: "text",
      id: placeholder.originalId,
      className: shape.className,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      strokeLinecap: shape.strokeLinecap,
      strokeLinejoin: shape.strokeLinejoin,
      opacity: shape.opacity,
      transform: shape.transform,
      animations: shape.animations,
      x: shape.x,
      y: shape.y,
      text: placeholder.text,
      fontSize: placeholder.fontSize,
      fontFamily: placeholder.fontFamily,
      fontWeight: placeholder.fontWeight,
      textAnchor: placeholder.textAnchor,
    };

    return text;
  }

  return {
    ...scene,
    layers: scene.layers.map((layer) => ({
      ...layer,
      shapes: layer.shapes.map(restore),
    })),
  };
}

function parseStyle(value: string | undefined) {
  const result = new Map<string, string>();
  if (!value) return result;

  for (const declaration of value.split(";")) {
    const separator = declaration.indexOf(":");
    if (separator < 0) continue;
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const propertyValue = declaration.slice(separator + 1).trim();
    if (property && propertyValue) result.set(property, propertyValue);
  }
  return result;
}

function nonBlank(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseOptionalSvgNumber(
  value: string | undefined,
  attribute: string,
  element: XmlElement,
  issues: FlatSvgImportIssue[],
) {
  if (value === undefined || !value.trim()) return undefined;
  const match = value
    .trim()
    .match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(?:px)?$/i);
  const parsed = match ? Number(match[1]) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    issues.push({
      code: "invalid-value",
      element: "text",
      id: element.attributes.id,
      message: `${attribute}=${JSON.stringify(value)} is not a positive unitless/px value and was ignored.`,
    });
    return undefined;
  }
  return parsed;
}

function parseFontWeight(
  value: string | undefined,
  element: XmlElement,
  issues: FlatSvgImportIssue[],
): number | string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    const parsed = Number(trimmed);
    if (parsed >= 1 && parsed <= 1_000) return parsed;
  } else {
    return trimmed;
  }

  issues.push({
    code: "invalid-value",
    element: "text",
    id: element.attributes.id,
    message: `font-weight=${JSON.stringify(value)} is outside the supported 1..1000/string range and was ignored.`,
  });
  return undefined;
}

function parseTextAnchor(
  value: string | undefined,
  element: XmlElement,
  issues: FlatSvgImportIssue[],
): "start" | "middle" | "end" | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed === "start" || trimmed === "middle" || trimmed === "end") return trimmed;

  issues.push({
    code: "invalid-value",
    element: "text",
    id: element.attributes.id,
    message: `text-anchor=${JSON.stringify(value)} is not start, middle, or end and was ignored.`,
  });
  return undefined;
}

function normalizeSvgText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function visitElements(element: XmlElement, visitor: (element: XmlElement) => void) {
  visitor(element);
  element.children.forEach((child) => visitElements(child, visitor));
}

function localName(name: string) {
  return name.split(":").at(-1) ?? name;
}

function serializeXml(element: XmlElement): string {
  const attributes = Object.entries(element.attributes)
    .map(([name, value]) => `${name}="${escapeXmlAttribute(value)}"`)
    .join(" ");
  const opening = attributes ? `<${element.name} ${attributes}>` : `<${element.name}>`;
  const body = `${element.text.map(escapeXmlText).join("")}${element.children
    .map(serializeXml)
    .join("")}`;
  return `${opening}${body}</${element.name}>`;
}

function escapeXmlAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXmlText(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function parseXml(markup: string): XmlElement {
  if (!markup.trim()) {
    throw new FlatSvgImportError("SVG markup is empty.");
  }

  const documentRoot: XmlElement = {
    name: "#document",
    attributes: {},
    children: [],
    text: [],
  };
  const stack: XmlElement[] = [documentRoot];
  let index = 0;

  while (index < markup.length) {
    if (markup[index] !== "<") {
      const nextTag = markup.indexOf("<", index);
      const end = nextTag < 0 ? markup.length : nextTag;
      stack.at(-1)!.text.push(decodeXmlEntities(markup.slice(index, end)));
      index = end;
      continue;
    }

    if (markup.startsWith("<!--", index)) {
      const end = markup.indexOf("-->", index + 4);
      if (end < 0) throw new FlatSvgImportError("Unterminated SVG comment.");
      index = end + 3;
      continue;
    }

    if (markup.startsWith("<?", index)) {
      const end = markup.indexOf("?>", index + 2);
      if (end < 0) throw new FlatSvgImportError("Unterminated XML processing instruction.");
      index = end + 2;
      continue;
    }

    if (markup.startsWith("<![CDATA[", index)) {
      const end = markup.indexOf("]]>", index + 9);
      if (end < 0) throw new FlatSvgImportError("Unterminated CDATA section.");
      stack.at(-1)!.text.push(markup.slice(index + 9, end));
      index = end + 3;
      continue;
    }

    if (markup.startsWith("<!", index)) {
      throw new FlatSvgImportError(
        "DOCTYPE and other XML declarations are not accepted by the SVG importer.",
      );
    }

    const tagEnd = findTagEnd(markup, index + 1);
    if (tagEnd < 0) throw new FlatSvgImportError("Unterminated SVG tag.");

    const rawTag = markup.slice(index + 1, tagEnd).trim();
    index = tagEnd + 1;
    if (!rawTag) continue;

    if (rawTag.startsWith("/")) {
      const closingName = rawTag.slice(1).trim();
      const current = stack.at(-1);
      if (!current || current === documentRoot || current.name !== closingName) {
        throw new FlatSvgImportError(`Unexpected closing tag </${closingName}>.`);
      }
      stack.pop();
      continue;
    }

    const selfClosing = rawTag.endsWith("/");
    const tagBody = selfClosing ? rawTag.slice(0, -1).trimEnd() : rawTag;
    const nameMatch = tagBody.match(/^([^\s/>]+)/);
    if (!nameMatch) throw new FlatSvgImportError(`Invalid SVG tag <${rawTag}>.`);

    const name = nameMatch[1]!;
    const element: XmlElement = {
      name,
      attributes: parseXmlAttributes(tagBody.slice(name.length)),
      children: [],
      text: [],
    };
    stack.at(-1)!.children.push(element);
    if (!selfClosing) stack.push(element);
  }

  if (stack.length !== 1) {
    throw new FlatSvgImportError(`Unclosed SVG tag <${stack.at(-1)!.name}>.`);
  }
  if (documentRoot.children.length !== 1) {
    throw new FlatSvgImportError("Expected exactly one SVG document element.");
  }
  return documentRoot.children[0]!;
}

function findTagEnd(markup: string, startIndex: number) {
  let quote: '"' | "'" | undefined;
  for (let index = startIndex; index < markup.length; index += 1) {
    const character = markup[index];
    if (quote) {
      if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === ">") return index;
  }
  return -1;
}

function parseXmlAttributes(source: string) {
  const attributes: Record<string, string> = {};
  let index = 0;

  while (index < source.length) {
    while (/\s/.test(source[index] ?? "")) index += 1;
    if (index >= source.length) break;

    const nameStart = index;
    while (index < source.length && !/[\s=]/.test(source[index]!)) index += 1;
    const name = source.slice(nameStart, index);
    while (/\s/.test(source[index] ?? "")) index += 1;
    if (source[index] !== "=") {
      throw new FlatSvgImportError(`Attribute ${name} is missing '='.`);
    }
    index += 1;
    while (/\s/.test(source[index] ?? "")) index += 1;

    const quote = source[index];
    if (quote !== '"' && quote !== "'") {
      throw new FlatSvgImportError(`Attribute ${name} must use quoted XML syntax.`);
    }
    index += 1;
    const valueStart = index;
    const valueEnd = source.indexOf(quote, valueStart);
    if (valueEnd < 0) {
      throw new FlatSvgImportError(`Attribute ${name} has an unterminated value.`);
    }
    attributes[name] = decodeXmlEntities(source.slice(valueStart, valueEnd));
    index = valueEnd + 1;
  }

  return attributes;
}

function decodeXmlEntities(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (match, entity: string) => {
    switch (entity.toLowerCase()) {
      case "amp":
        return "&";
      case "apos":
        return "'";
      case "gt":
        return ">";
      case "lt":
        return "<";
      case "quot":
        return '"';
      default: {
        const codePoint = entity.toLowerCase().startsWith("#x")
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
      }
    }
  });
}
