# Flat-design document contract

Use `FlatDesignScene` for in-memory rendering and editing. Use the versioned `FlatDesignDocument` boundary when a scene is persisted, exchanged between packages, or sent to another renderer.

- `defineFlatDesignDocument(scene)` upgrades a legacy scene to the current schema version and validates it.
- `analyzeFlatDesignDocument(value)` returns errors plus portability warnings for editor surfaces.
- `validateFlatDesignDocument(value)` returns strict errors only.
- `parseFlatDesignDocument(json)` accepts legacy unversioned scenes by default and returns a validated current document.
- `serializeFlatDesignDocument(scene)` writes the current versioned format.
- `flatDesignDocumentJsonSchema` exposes the matching Draft 2020-12 schema.

`className` and raw SVG `transform` strings remain accepted for compatibility, but analysis reports them as portability warnings. Durable artwork should encode visual meaning in scene properties and motion data instead of relying on application CSS.
