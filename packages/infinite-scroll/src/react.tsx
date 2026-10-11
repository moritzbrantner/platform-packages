"use client";

import * as React from "react";

import {
  saveInfiniteScrollRestoration,
  type CursorPage,
  type InfiniteScrollRestorationState,
  type InfiniteScrollRestorationStorage,
} from "./core";

export type UseInfiniteScrollOptions = {
  enabled?: boolean;
  hasMore: boolean;
  isLoading?: boolean;
  onLoadMore: () => void;
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number;
};

export type UseInfiniteScrollResult<TElement extends Element> = {
  loadMore: () => void;
  ref: React.RefCallback<TElement>;
};

function useInfiniteScroll<TElement extends Element = HTMLDivElement>({
  enabled = true,
  hasMore,
  isLoading = false,
  onLoadMore,
  root = null,
  rootMargin = "0px 0px 400px 0px",
  threshold = 0,
}: UseInfiniteScrollOptions): UseInfiniteScrollResult<TElement> {
  const [target, setTarget] = React.useState<TElement | null>(null);
  const stateRef = React.useRef({ enabled, hasMore, isLoading, onLoadMore });

  // Sync during commit so an abandoned concurrent render never leaks into observer callbacks.
  React.useLayoutEffect(() => {
    stateRef.current = { enabled, hasMore, isLoading, onLoadMore };
  });

  const loadMore = React.useCallback(() => {
    const state = stateRef.current;
    if (!state.enabled || !state.hasMore || state.isLoading) {
      return;
    }

    state.onLoadMore();
  }, []);

  React.useEffect(() => {
    if (
      !target ||
      !enabled ||
      !hasMore ||
      isLoading ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { root, rootMargin, threshold },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, hasMore, isLoading, loadMore, root, rootMargin, target, threshold]);

  return { loadMore, ref: setTarget };
}

function setRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}

export type InfiniteScrollTriggerProps = Omit<React.ComponentProps<"div">, "ref"> &
  UseInfiniteScrollOptions;

const InfiniteScrollTrigger = React.forwardRef<HTMLDivElement, InfiniteScrollTriggerProps>(
  function InfiniteScrollTrigger(
    {
      enabled = true,
      hasMore,
      isLoading = false,
      onLoadMore,
      root,
      rootMargin,
      threshold,
      ...props
    },
    forwardedRef,
  ) {
    const { ref } = useInfiniteScroll<HTMLDivElement>({
      enabled,
      hasMore,
      isLoading,
      onLoadMore,
      root,
      rootMargin,
      threshold,
    });
    const composedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        ref(node);
        setRef(forwardedRef, node);
      },
      [forwardedRef, ref],
    );

    return (
      <div
        ref={composedRef}
        data-slot="infinite-scroll-trigger"
        data-enabled={enabled ? "true" : "false"}
        data-has-more={hasMore ? "true" : "false"}
        data-loading={isLoading ? "true" : "false"}
        {...props}
      />
    );
  },
);

export type UseInfiniteScrollRestorationOptions<TItem, TCursor = string> = {
  /** Identifies this feed in `storage`; feeds with different keys never interfere. */
  key: string;
  storage: InfiniteScrollRestorationStorage;
  /** State the app read with `readInfiniteScrollRestoration` and seeded its pages from. */
  restoredState: InfiniteScrollRestorationState<TItem, TCursor> | null;
  /** Pages currently rendered. */
  pages: readonly CursorPage<TItem, TCursor>[];
  contentKey?: string;
  /** Opt-in switch; when false nothing is restored or saved. */
  enabled?: boolean;
};

export type UseInfiniteScrollRestorationResult = {
  /** Attach to the scroll container. */
  scrollRef: React.RefCallback<HTMLElement>;
  /** True until the saved offset has been applied. */
  isRestoring: boolean;
  /** Persist the current pages and scroll offset now. */
  save: () => void;
};

/**
 * Stable identity of a snapshot's content, so equivalent objects compare equal while a
 * different snapshot (other pages, cursors or offset) does not.
 */
function restorationFingerprint(state: InfiniteScrollRestorationState<unknown, unknown>): string {
  return JSON.stringify([
    state.contentKey ?? null,
    state.scrollOffset,
    state.pageParams,
    state.pages.map((page) => [page.items.length, page.nextCursor]),
  ]);
}

/**
 * Restores and saves the viewport of an infinite feed. The app owns reading the state and
 * seeding its pages (so restored pages are never refetched) and owns routing; this hook applies
 * the saved offset once the restored content is rendered, and saves on unmount or on demand.
 */
function useInfiniteScrollRestoration<TItem, TCursor = string>({
  contentKey,
  enabled = true,
  key,
  pages,
  restoredState,
  storage,
}: UseInfiniteScrollRestorationOptions<TItem, TCursor>): UseInfiniteScrollRestorationResult {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  // Logical identity of the restoration whose offset has been applied: the feed key plus the
  // snapshot's fingerprint. A snapshot that arrives after mount, a switch to another feed's
  // snapshot, or `enabled` turning on is a new restoration and is applied once; a parent
  // passing a fresh but equivalent object each render is the same restoration.
  const [appliedRestoration, setAppliedRestoration] = React.useState<string | null>(null);
  const snapshotFingerprint = React.useMemo(
    () => (restoredState ? restorationFingerprint(restoredState) : null),
    [restoredState],
  );
  const restoration =
    enabled && snapshotFingerprint !== null ? `${key}\u0000${snapshotFingerprint}` : null;
  const isRestoring = restoration !== null && appliedRestoration !== restoration;
  const offsetRef = React.useRef(0);
  const latestRef = React.useRef({
    contentKey,
    enabled,
    isRestoring,
    key,
    pages,
    restoredState,
    storage,
  });

  React.useLayoutEffect(() => {
    latestRef.current = { contentKey, enabled, isRestoring, key, pages, restoredState, storage };
  });

  // Apply the saved offset exactly once, in the first commit where the restored pages are
  // rendered, so the viewport never shows the top of the feed and then jumps back.
  React.useLayoutEffect(() => {
    if (restoration === null || !restoredState) {
      if (appliedRestoration !== null) {
        setAppliedRestoration(null);
      }
      return;
    }

    if (
      appliedRestoration === restoration ||
      !container ||
      pages.length < restoredState.pages.length
    ) {
      return;
    }

    const maxOffset = Math.max(0, container.scrollHeight - container.clientHeight);
    const offset = Math.min(restoredState.scrollOffset, maxOffset);
    offsetRef.current = offset;
    if (typeof container.scrollTo === "function") {
      container.scrollTo({ top: offset });
    } else {
      container.scrollTop = offset;
    }
    setAppliedRestoration(restoration);
  }, [appliedRestoration, container, pages.length, restoration, restoredState]);

  React.useEffect(() => {
    if (!container || !enabled) {
      return;
    }

    const onScroll = () => {
      offsetRef.current = container.scrollTop;
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [container, enabled]);

  const save = React.useCallback(() => {
    const latest = latestRef.current;
    // An empty feed has nothing to restore; keep any previously saved state.
    if (!latest.enabled || latest.pages.length === 0) {
      return;
    }

    saveInfiniteScrollRestoration<TItem, TCursor>(latest.storage, latest.key, {
      contentKey: latest.contentKey,
      pages: latest.pages,
      // Until the saved offset is applied, saving must not overwrite it with the current 0.
      scrollOffset:
        latest.isRestoring && latest.restoredState
          ? latest.restoredState.scrollOffset
          : offsetRef.current,
    });
  }, []);

  React.useEffect(() => save, [save]);

  return { isRestoring, save, scrollRef: setContainer };
}

export { InfiniteScrollTrigger, useInfiniteScroll, useInfiniteScrollRestoration };
