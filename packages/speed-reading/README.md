# @moritzbrantner/speed-reading

> Deprecated: this is the legacy implementation. The canonical speed-reading
> product and reader core now live in
> [moritzbrantner/speedreader](https://github.com/moritzbrantner/speedreader).

This package remains available so existing consumers are not broken or silently
redirected. It receives no new features. Do not replace imports automatically:
the canonical repository intentionally has a different, platform-neutral reader
contract and application adapters.

## Migration

1. Review the new reader package, its versioned persistence contract, and the
   shared parity fixtures in `moritzbrantner/speedreader`.
2. Port each consumer deliberately, preserving its product-specific UI and
   storage adapter rather than depending on the old packaged view.
3. Verify its chunking, pacing, Unicode handling, and restored progress against
   the canonical parity fixtures before removing this dependency.

This repository will retain the legacy source and a compatibility/deprecation
record until consumers have migrated. A future removal requires separately
authorized release work; it is not implied by this notice.

## Legacy API

Speed-reading chunking helpers and a React RSVP-style reading view retained for
existing consumers.

## Main APIs

- `createSpeedReadingChunks(text, options)`
- `countSpeedReadingWords(text)` / `getSpeedReadingDelay(chunk, options)` / `getPivotIndex(word)`
- `SpeedReadingView`
