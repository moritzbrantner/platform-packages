# @moritzbrantner/extraction-schema

Schema contracts and deterministic normalization utilities for extraction pipelines.

## Features

- Define strict extraction targets for entities, fields, and relations.
- Validate normalized outputs against schema and confidence policies.
- Canonicalize values with helpers for date normalization, locale-aware numeric parsing, and cleanup.
- Adapt heterogeneous model outputs from `information-extraction` and `document-structure-extraction` into typed deterministic objects.
- Run rule-based postprocessors to remove placeholder/hallucinated values and deduplicate fields/relations before persistence.

## Main APIs

- `validateExtractionSchema(schema)`
- `validateExtractionOutput(output, schema, policy?)`
- `normalizeDate(value, { locale?, dateOrder? })`
- `parseNumericWithUnit(value, { locale?, defaultUnit? })`
- `createConfidenceThresholdPolicy(partial?)`
- `filterExtractionByPolicy(output, policy)`
- `adaptInformationExtractionOutput(raw)`
- `adaptDocumentStructureExtractionOutput(raw)`
- `applyRuleBasedPostprocessors(output)`
