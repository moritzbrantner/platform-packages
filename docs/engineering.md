# Engineering Standards

This repository follows Clean Code rules by default.

## Core rules

- Prefer names that explain intent without requiring surrounding context.
- Keep functions, components, and modules focused on one responsibility.
- Make dependencies and data flow explicit instead of relying on hidden coupling.
- Remove duplication when it obscures ownership or behavior.
- Keep public APIs small, coherent, and hard to misuse.
- Isolate domain logic from presentation, transport, and framework glue.
- Write code so the normal path is easy to read top to bottom.
- Add tests when behavior, edge cases, or regressions are not obvious from inspection.
- Add short documentation when package boundaries, invariants, or tradeoffs are not obvious from the code.

## Practical expectations in this repo

- Shared packages should expose narrow, composable APIs instead of monolithic convenience surfaces.
- UI packages should separate stateful behavior from rendering where reuse or customization is likely.
- Playground pages should validate package behavior, not become the primary home for package logic.
- Experimental packages should still meet the same readability bar as scaffold-critical packages.
- Refactors should improve clarity and maintainability, not just move code around.

## Review checklist

Before merging, check whether the change:

- Uses names that describe the domain concept or user-facing behavior.
- Keeps each file and exported symbol within a clear responsibility boundary.
- Avoids avoidable branching, flags, or prop combinations that make behavior hard to reason about.
- Removes or contains duplication instead of copying logic into a second place.
- Preserves a clear distinction between core logic, React/view code, and example/playground code.
- Includes tests or docs for new behavior, edge cases, or non-obvious constraints.
