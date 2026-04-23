# @moritzbrantner/tables

Windowed table-density indexes for large row collections and viewport summaries.

## Main APIs

- `createTableDensityIndex(rows, options)` / `createTableWindowIndex(rows, options)`
- `index.getRowWindow(query)` / `index.getWindow(query)`
- `createTableDensityViewportSummary(window)`
