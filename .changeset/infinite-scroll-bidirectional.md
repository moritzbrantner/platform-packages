---
"@moritzbrantner/infinite-scroll": minor
---

Add bidirectional infinite scrolling: `previousCursor` on `CursorPage`, `hasPreviousCursor`, and `useBidirectionalInfiniteScroll` with independent per-direction guards and prepend anchoring. Guarded loads now latch until the next render so rapid observer callbacks cannot double-load.
