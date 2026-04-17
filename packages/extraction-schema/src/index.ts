const DEFAULT_POLICY_ID = "default";

export type PrimitiveFieldType = "string" | "number" | "integer" | "boolean" | "date";

export interface ExtractionFieldSchema {
  name: string;
  type: PrimitiveFieldType;
  required?: boolean;
  aliases?: string[];
  unit?: string;
  locale?: string;
  minimumConfidence?: number;
}

export interface ExtractionEntitySchema {
  type: string;
  fields: ExtractionFieldSchema[];
  allowUnknownFields?: boolean;
  aliases?: string[];
}

export interface RelationTypeSchema {
  type: string;
  from: string;
  to: string;
  aliases?: string[];
  minimumConfidence?: number;
}

export interface ExtractionSchema {
  entities: ExtractionEntitySchema[];
  relations?: RelationTypeSchema[];
}

export interface NormalizedField {
  name: string;
  value: string | number | boolean;
  rawValue: unknown;
  confidence: number;
  unit?: string;
}

export interface NormalizedEntity {
  id: string;
  type: string;
  confidence: number;
  fields: Record<string, NormalizedField>;
  source?: string;
}

export interface NormalizedRelation {
  type: string;
  fromEntityId: string;
  toEntityId: string;
  confidence: number;
  source?: string;
}

export interface NormalizedExtraction {
  entities: NormalizedEntity[];
  relations: NormalizedRelation[];
}

export interface ValidationIssue {
  code:
    | "UNKNOWN_ENTITY"
    | "UNKNOWN_RELATION"
    | "INVALID_FIELD"
    | "MISSING_FIELD"
    | "INVALID_RELATION_ENDPOINT"
    | "LOW_CONFIDENCE";
  message: string;
  entityId?: string;
  relationType?: string;
  fieldName?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export interface CanonicalizationOptions {
  locale?: string;
  dateOrder?: "mdy" | "dmy" | "ymd";
  defaultUnit?: string;
}

export interface ConfidenceThresholdPolicy {
  id: string;
  entityMinimum: number;
  fieldMinimum: number;
  relationMinimum: number;
  perEntityType?: Record<string, number>;
  perFieldPath?: Record<string, number>;
  perRelationType?: Record<string, number>;
}

export interface FilterExtractionByPolicyOptions {
  removeLowConfidenceFields?: boolean;
  removeLowConfidenceEntities?: boolean;
  removeLowConfidenceRelations?: boolean;
}

export interface InformationExtractionRecord {
  id?: string;
  type?: string;
  label?: string;
  confidence?: number;
  properties?: Record<string, unknown>;
  fields?: Array<{ name?: string; key?: string; value?: unknown; confidence?: number; unit?: string }>;
}

export interface InformationExtractionOutput {
  entities?: InformationExtractionRecord[];
  relations?: Array<{
    type?: string;
    from?: string;
    to?: string;
    source?: string;
    target?: string;
    confidence?: number;
  }>;
}

type InformationExtractionRelationRecord = NonNullable<InformationExtractionOutput["relations"]>[number];

export interface DocumentStructureBlock {
  id?: string;
  kind?: string;
  type?: string;
  confidence?: number;
  values?: Record<string, unknown>;
  entities?: Array<{
    label?: string;
    value?: unknown;
    confidence?: number;
  }>;
}

export interface DocumentStructureExtractionOutput {
  blocks?: DocumentStructureBlock[];
  links?: Array<{
    relation?: string;
    fromBlockId?: string;
    toBlockId?: string;
    confidence?: number;
  }>;
}

type DocumentStructureLinkRecord = NonNullable<DocumentStructureExtractionOutput["links"]>[number];

export interface PostprocessOptions {
  dedupeByValue?: boolean;
  trimTextValues?: boolean;
  removePlaceholderValues?: boolean;
}

export function validateExtractionSchema(schema: ExtractionSchema): ValidationResult {
  const issues: ValidationIssue[] = [];
  const entityTypes = new Set<string>();

  for (const entity of schema.entities) {
    if (entityTypes.has(entity.type)) {
      issues.push({
        code: "INVALID_FIELD",
        message: `Duplicate entity type '${entity.type}'.`,
      });
    }

    entityTypes.add(entity.type);

    const fieldNames = new Set<string>();

    for (const field of entity.fields) {
      if (fieldNames.has(field.name)) {
        issues.push({
          code: "INVALID_FIELD",
          message: `Duplicate field '${field.name}' on entity '${entity.type}'.`,
          fieldName: field.name,
        });
      }

      fieldNames.add(field.name);
    }
  }

  for (const relation of schema.relations ?? []) {
    if (!entityTypes.has(relation.from) || !entityTypes.has(relation.to)) {
      issues.push({
        code: "INVALID_RELATION_ENDPOINT",
        message: `Relation '${relation.type}' uses unknown endpoints (${relation.from} -> ${relation.to}).`,
        relationType: relation.type,
      });
    }
  }

  return { ok: issues.length === 0, issues };
}

export function validateExtractionOutput(
  output: NormalizedExtraction,
  schema: ExtractionSchema,
  policy?: ConfidenceThresholdPolicy,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const entitySchemas = new Map(schema.entities.map((entity) => [entity.type, entity]));
  const entityById = new Map(output.entities.map((entity) => [entity.id, entity]));

  for (const entity of output.entities) {
    const entitySchema = entitySchemas.get(entity.type);

    if (!entitySchema) {
      issues.push({
        code: "UNKNOWN_ENTITY",
        message: `Unknown entity type '${entity.type}'.`,
        entityId: entity.id,
      });
      continue;
    }

    const minEntityConfidence = resolveEntityThreshold(entity.type, policy);

    if (entity.confidence < minEntityConfidence) {
      issues.push({
        code: "LOW_CONFIDENCE",
        message: `Entity '${entity.id}' confidence ${entity.confidence} is below ${minEntityConfidence}.`,
        entityId: entity.id,
      });
    }

    const fieldSchemas = new Map(entitySchema.fields.map((field) => [field.name, field]));

    for (const requiredField of entitySchema.fields.filter((field) => field.required)) {
      if (!entity.fields[requiredField.name]) {
        issues.push({
          code: "MISSING_FIELD",
          message: `Missing required field '${requiredField.name}' on entity '${entity.id}'.`,
          entityId: entity.id,
          fieldName: requiredField.name,
        });
      }
    }

    for (const [fieldName, fieldValue] of Object.entries(entity.fields)) {
      const fieldSchema = fieldSchemas.get(fieldName);

      if (!fieldSchema) {
        if (!entitySchema.allowUnknownFields) {
          issues.push({
            code: "INVALID_FIELD",
            message: `Unknown field '${fieldName}' on entity '${entity.id}'.`,
            entityId: entity.id,
            fieldName,
          });
        }
        continue;
      }

      if (!isValueAssignable(fieldValue.value, fieldSchema.type)) {
        issues.push({
          code: "INVALID_FIELD",
          message: `Field '${fieldName}' on entity '${entity.id}' is not a valid ${fieldSchema.type}.`,
          entityId: entity.id,
          fieldName,
        });
      }

      const minFieldConfidence = resolveFieldThreshold(entity.type, fieldName, policy, fieldSchema);

      if (fieldValue.confidence < minFieldConfidence) {
        issues.push({
          code: "LOW_CONFIDENCE",
          message: `Field '${fieldName}' on entity '${entity.id}' confidence ${fieldValue.confidence} is below ${minFieldConfidence}.`,
          entityId: entity.id,
          fieldName,
        });
      }
    }
  }

  const relationSchemas = new Map((schema.relations ?? []).map((relation) => [relation.type, relation]));

  for (const relation of output.relations) {
    const relationSchema = relationSchemas.get(relation.type);

    if (!relationSchema) {
      issues.push({
        code: "UNKNOWN_RELATION",
        message: `Unknown relation '${relation.type}'.`,
        relationType: relation.type,
      });
      continue;
    }

    const fromEntity = entityById.get(relation.fromEntityId);
    const toEntity = entityById.get(relation.toEntityId);

    if (!fromEntity || !toEntity) {
      issues.push({
        code: "INVALID_RELATION_ENDPOINT",
        message: `Relation '${relation.type}' references unknown entity ids.`,
        relationType: relation.type,
      });
      continue;
    }

    if (fromEntity.type !== relationSchema.from || toEntity.type !== relationSchema.to) {
      issues.push({
        code: "INVALID_RELATION_ENDPOINT",
        message: `Relation '${relation.type}' expects ${relationSchema.from} -> ${relationSchema.to} but got ${fromEntity.type} -> ${toEntity.type}.`,
        relationType: relation.type,
      });
    }

    const minRelationConfidence = resolveRelationThreshold(relation.type, policy, relationSchema);

    if (relation.confidence < minRelationConfidence) {
      issues.push({
        code: "LOW_CONFIDENCE",
        message: `Relation '${relation.type}' confidence ${relation.confidence} is below ${minRelationConfidence}.`,
        relationType: relation.type,
      });
    }
  }

  return { ok: issues.length === 0, issues };
}

export function normalizeDate(value: string | Date, options: CanonicalizationOptions = {}): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  const text = value.trim();
  if (!text) {
    return null;
  }

  const direct = new Date(text);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10);
  }

  const normalized = text.replace(/[.\-]/gu, "/");
  const chunks = normalized.split("/").map((chunk) => chunk.trim());

  if (chunks.length !== 3 || chunks.some((chunk) => chunk.length === 0)) {
    return null;
  }

  const order = options.dateOrder ?? inferDateOrder(options.locale);
  const [a, b, c] = chunks.map((chunk) => Number.parseInt(chunk, 10));

  if ([a, b, c].some((part) => !Number.isFinite(part))) {
    return null;
  }

  const parts =
    order === "dmy" ? { day: a, month: b, year: c } : order === "ymd" ? { year: a, month: b, day: c } : { month: a, day: b, year: c };

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

  if (
    date.getUTCFullYear() !== parts.year ||
    date.getUTCMonth() !== parts.month - 1 ||
    date.getUTCDate() !== parts.day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

export function parseNumericWithUnit(
  input: unknown,
  options: CanonicalizationOptions = {},
): { value: number; unit?: string } | null {
  if (typeof input === "number" && Number.isFinite(input)) {
    return { value: input, unit: options.defaultUnit };
  }

  if (typeof input !== "string") {
    return null;
  }

  const normalized = normalizeLocalizedValue(input, options.locale);
  const match = normalized.match(/^(?<amount>[+-]?\d+(?:\.\d+)?)(?:\s*(?<unit>[\p{L}%/]+))?$/u);

  if (!match || !match.groups) {
    return null;
  }

  const amount = Number.parseFloat(match.groups.amount);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return {
    value: amount,
    unit: match.groups.unit || options.defaultUnit,
  };
}

export function normalizeLocalizedValue(value: string, locale = "en-US"): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const decimalSeparator = localeUsesCommaDecimal(locale) ? "," : ".";
  const thousandSeparator = decimalSeparator === "." ? "," : ".";

  return trimmed
    .replace(new RegExp(`\\${thousandSeparator}`, "gu"), "")
    .replace(decimalSeparator === "," ? /,/gu : /\u00A0/gu, decimalSeparator === "," ? "." : "")
    .replace(/\s+/gu, " ")
    .trim();
}

export function createConfidenceThresholdPolicy(
  partial: Partial<ConfidenceThresholdPolicy> = {},
): ConfidenceThresholdPolicy {
  return {
    id: partial.id ?? DEFAULT_POLICY_ID,
    entityMinimum: clampConfidence(partial.entityMinimum ?? 0.6),
    fieldMinimum: clampConfidence(partial.fieldMinimum ?? 0.5),
    relationMinimum: clampConfidence(partial.relationMinimum ?? 0.5),
    perEntityType: partial.perEntityType ?? {},
    perFieldPath: partial.perFieldPath ?? {},
    perRelationType: partial.perRelationType ?? {},
  };
}

export function filterExtractionByPolicy(
  extraction: NormalizedExtraction,
  policy: ConfidenceThresholdPolicy,
  options: FilterExtractionByPolicyOptions = {},
): NormalizedExtraction {
  const removeLowConfidenceEntities = options.removeLowConfidenceEntities ?? true;
  const removeLowConfidenceFields = options.removeLowConfidenceFields ?? true;
  const removeLowConfidenceRelations = options.removeLowConfidenceRelations ?? true;

  const entities = extraction.entities
    .map((entity) => {
      const fields = Object.fromEntries(
        Object.entries(entity.fields).filter(([fieldName, field]) => {
          if (!removeLowConfidenceFields) {
            return true;
          }

          return field.confidence >= resolveFieldThreshold(entity.type, fieldName, policy);
        }),
      );

      return {
        ...entity,
        fields,
      };
    })
    .filter((entity) => {
      if (!removeLowConfidenceEntities) {
        return true;
      }

      return entity.confidence >= resolveEntityThreshold(entity.type, policy);
    });

  const allowedIds = new Set(entities.map((entity) => entity.id));

  const relations = extraction.relations.filter((relation) => {
    if (!allowedIds.has(relation.fromEntityId) || !allowedIds.has(relation.toEntityId)) {
      return false;
    }

    if (!removeLowConfidenceRelations) {
      return true;
    }

    return relation.confidence >= resolveRelationThreshold(relation.type, policy);
  });

  return { entities, relations };
}

export function adaptInformationExtractionOutput(
  input: InformationExtractionOutput,
  options: CanonicalizationOptions = {},
): NormalizedExtraction {
  const entities = (input.entities ?? [])
    .map((record, index) => normalizeInformationEntity(record, index, options))
    .filter((entity): entity is NormalizedEntity => entity !== null)
    .sort(compareEntityDeterministically);

  const entityIdSet = new Set(entities.map((entity) => entity.id));

  const relations = (input.relations ?? [])
    .map((relation) => normalizeInformationRelation(relation))
    .filter((relation): relation is NormalizedRelation => relation !== null)
    .filter((relation) => entityIdSet.has(relation.fromEntityId) && entityIdSet.has(relation.toEntityId))
    .sort(compareRelationDeterministically);

  return { entities, relations };
}

export function adaptDocumentStructureExtractionOutput(
  input: DocumentStructureExtractionOutput,
  options: CanonicalizationOptions = {},
): NormalizedExtraction {
  const entities = (input.blocks ?? [])
    .map((block, index) => normalizeDocumentBlock(block, index, options))
    .filter((entity): entity is NormalizedEntity => entity !== null)
    .sort(compareEntityDeterministically);

  const entityIdSet = new Set(entities.map((entity) => entity.id));

  const relations = (input.links ?? [])
    .map((link) => normalizeDocumentLink(link))
    .filter((relation): relation is NormalizedRelation => relation !== null)
    .filter((relation) => entityIdSet.has(relation.fromEntityId) && entityIdSet.has(relation.toEntityId))
    .sort(compareRelationDeterministically);

  return { entities, relations };
}

export function applyRuleBasedPostprocessors(
  extraction: NormalizedExtraction,
  options: PostprocessOptions = {},
): NormalizedExtraction {
  const dedupeByValue = options.dedupeByValue ?? true;
  const trimTextValues = options.trimTextValues ?? true;
  const removePlaceholderValues = options.removePlaceholderValues ?? true;

  const entities = extraction.entities.map((entity) => {
    const cleaned = Object.entries(entity.fields)
      .map(([fieldName, field]): [string, NormalizedField] | null => {
        const next = { ...field };

        if (typeof next.value === "string" && trimTextValues) {
          next.value = next.value.trim();
        }

        if (removePlaceholderValues && isPlaceholderValue(next.value)) {
          return null;
        }

        return [fieldName, next];
      })
      .filter((entry): entry is [string, NormalizedField] => entry !== null);

    const deduped = dedupeByValue ? dedupeFieldEntries(cleaned) : cleaned;

    return {
      ...entity,
      fields: Object.fromEntries(deduped),
    };
  });

  return {
    entities,
    relations: dedupeRelations(extraction.relations),
  };
}

function normalizeInformationEntity(
  record: InformationExtractionRecord,
  index: number,
  options: CanonicalizationOptions,
): NormalizedEntity | null {
  const type = normalizeKey(record.type ?? record.label ?? "");

  if (!type) {
    return null;
  }

  const id = record.id?.trim() || `${type}-${index}`;
  const confidence = clampConfidence(record.confidence ?? 1);

  const fields: Record<string, NormalizedField> = {};

  for (const [key, value] of Object.entries(record.properties ?? {})) {
    const normalized = normalizeField(key, value, 1, options);
    if (normalized) {
      fields[normalized.name] = normalized;
    }
  }

  for (const field of record.fields ?? []) {
    const fieldName = field.name ?? field.key;
    if (!fieldName) {
      continue;
    }

    const normalized = normalizeField(fieldName, field.value, field.confidence ?? confidence, options, field.unit);
    if (normalized) {
      fields[normalized.name] = normalized;
    }
  }

  return {
    id,
    type,
    confidence,
    fields,
    source: "information-extraction",
  };
}

function normalizeInformationRelation(
  relation: InformationExtractionRelationRecord,
): NormalizedRelation | null {
  if (!relation) {
    return null;
  }

  const type = normalizeKey(relation.type ?? "");
  const fromEntityId = relation.from?.trim() ?? relation.source?.trim();
  const toEntityId = relation.to?.trim() ?? relation.target?.trim();

  if (!type || !fromEntityId || !toEntityId) {
    return null;
  }

  return {
    type,
    fromEntityId,
    toEntityId,
    confidence: clampConfidence(relation.confidence ?? 1),
    source: "information-extraction",
  };
}

function normalizeDocumentBlock(
  block: DocumentStructureBlock,
  index: number,
  options: CanonicalizationOptions,
): NormalizedEntity | null {
  const type = normalizeKey(block.kind ?? block.type ?? "section");
  const id = block.id?.trim() || `${type}-${index}`;
  const confidence = clampConfidence(block.confidence ?? 1);

  const fields: Record<string, NormalizedField> = {};

  for (const [key, value] of Object.entries(block.values ?? {})) {
    const normalized = normalizeField(key, value, confidence, options);
    if (normalized) {
      fields[normalized.name] = normalized;
    }
  }

  for (const entity of block.entities ?? []) {
    const name = entity.label;

    if (!name) {
      continue;
    }

    const normalized = normalizeField(name, entity.value, entity.confidence ?? confidence, options);

    if (normalized) {
      fields[normalized.name] = normalized;
    }
  }

  return {
    id,
    type,
    confidence,
    fields,
    source: "document-structure-extraction",
  };
}

function normalizeDocumentLink(
  link: DocumentStructureLinkRecord,
): NormalizedRelation | null {
  if (!link?.relation || !link.fromBlockId || !link.toBlockId) {
    return null;
  }

  return {
    type: normalizeKey(link.relation),
    fromEntityId: link.fromBlockId,
    toEntityId: link.toBlockId,
    confidence: clampConfidence(link.confidence ?? 1),
    source: "document-structure-extraction",
  };
}

function normalizeField(
  fieldName: string,
  value: unknown,
  confidence: number,
  options: CanonicalizationOptions,
  explicitUnit?: string,
): NormalizedField | null {
  const name = normalizeKey(fieldName);
  if (!name) {
    return null;
  }

  if (typeof value === "string") {
    const maybeDate = normalizeDate(value, options);
    if (maybeDate) {
      return { name, value: maybeDate, rawValue: value, confidence: clampConfidence(confidence), unit: explicitUnit };
    }

    const parsedNumeric = parseNumericWithUnit(value, { ...options, defaultUnit: explicitUnit });

    if (parsedNumeric) {
      return {
        name,
        value: parsedNumeric.value,
        rawValue: value,
        confidence: clampConfidence(confidence),
        unit: parsedNumeric.unit,
      };
    }

    return {
      name,
      value: value.trim(),
      rawValue: value,
      confidence: clampConfidence(confidence),
      unit: explicitUnit,
    };
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return {
      name,
      value,
      rawValue: value,
      confidence: clampConfidence(confidence),
      unit: explicitUnit,
    };
  }

  return null;
}

function compareEntityDeterministically(left: NormalizedEntity, right: NormalizedEntity): number {
  return left.type.localeCompare(right.type) || left.id.localeCompare(right.id);
}

function compareRelationDeterministically(left: NormalizedRelation, right: NormalizedRelation): number {
  return (
    left.type.localeCompare(right.type) ||
    left.fromEntityId.localeCompare(right.fromEntityId) ||
    left.toEntityId.localeCompare(right.toEntityId)
  );
}

function resolveEntityThreshold(type: string, policy?: ConfidenceThresholdPolicy): number {
  if (!policy) {
    return 0;
  }

  return clampConfidence(policy.perEntityType?.[type] ?? policy.entityMinimum);
}

function resolveFieldThreshold(
  entityType: string,
  fieldName: string,
  policy?: ConfidenceThresholdPolicy,
  field?: ExtractionFieldSchema,
): number {
  if (!policy) {
    return clampConfidence(field?.minimumConfidence ?? 0);
  }

  const key = `${entityType}.${fieldName}`;

  return clampConfidence(policy.perFieldPath?.[key] ?? field?.minimumConfidence ?? policy.fieldMinimum);
}

function resolveRelationThreshold(
  relationType: string,
  policy?: ConfidenceThresholdPolicy,
  relation?: RelationTypeSchema,
): number {
  if (!policy) {
    return clampConfidence(relation?.minimumConfidence ?? 0);
  }

  return clampConfidence(policy.perRelationType?.[relationType] ?? relation?.minimumConfidence ?? policy.relationMinimum);
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/gu, "");
}

function localeUsesCommaDecimal(locale: string): boolean {
  const formatted = new Intl.NumberFormat(locale).format(1.1);
  return formatted.includes(",");
}

function inferDateOrder(locale = "en-US"): "mdy" | "dmy" | "ymd" {
  if (/^en-US/u.test(locale)) {
    return "mdy";
  }

  if (/^(zh|ja|ko)/u.test(locale)) {
    return "ymd";
  }

  return "dmy";
}

function isValueAssignable(value: unknown, type: PrimitiveFieldType): boolean {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "date":
      return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(value);
    default:
      return false;
  }
}

function isPlaceholderValue(value: string | number | boolean): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLocaleLowerCase();
  return normalized === "unknown" || normalized === "n/a" || normalized === "none";
}

function dedupeFieldEntries(entries: Array<[string, NormalizedField]>): Array<[string, NormalizedField]> {
  const byKey = new Map<string, [string, NormalizedField]>();

  for (const [fieldName, field] of entries) {
    const dedupeKey = `${fieldName}:${String(field.value).toLocaleLowerCase()}`;
    const existing = byKey.get(dedupeKey);

    if (!existing || existing[1].confidence < field.confidence) {
      byKey.set(dedupeKey, [fieldName, field]);
    }
  }

  return Array.from(byKey.values()).sort(([leftName], [rightName]) => leftName.localeCompare(rightName));
}

function dedupeRelations(relations: readonly NormalizedRelation[]): NormalizedRelation[] {
  const map = new Map<string, NormalizedRelation>();

  for (const relation of relations) {
    const key = `${relation.type}:${relation.fromEntityId}->${relation.toEntityId}`;
    const existing = map.get(key);

    if (!existing || existing.confidence < relation.confidence) {
      map.set(key, relation);
    }
  }

  return Array.from(map.values()).sort(compareRelationDeterministically);
}
