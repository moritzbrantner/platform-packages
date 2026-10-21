"use client";

import * as React from "react";

import {
  saveInfiniteScrollRestoration,
  type CursorPage,
  type InfiniteScrollRestorationState,
  type InfiniteScrollRestorationStorage,
} from "./core";

/**
 * - `automatic`: the observer loads; no manual control is needed.
 * - `manual`: only the manual control loads; nothing is observed.
 * - `automatic-with-fallback`: the observer loads, and the manual control is offered when
 *   `IntersectionObserver` is unavailable or the last load failed.
 */
export type InfiniteScrollMode = "automatic" | "manual" | "automatic-with-fallback";

export type InfiniteScrollStatus = "idle" | "loading" | "error" | "exhausted" | "disabled";

export type UseInfiniteScrollOptions = {
  enabled?: boolean;
  hasMore: boolean;
  /** The last load failed. Automatic loading pauses so it cannot retry in a loop. */
  isError?: boolean;
  isLoading?: boolean;
  mode?: InfiniteScrollMode;
  onLoadMore: () => void;
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number;
};

export type InfiniteScrollLoadMoreProps = {
  "aria-busy": boolean;
  "data-slot": "infinite-scroll-load-more";
  "data-state": InfiniteScrollStatus;
  disabled: boolean;
  onClick: () => void;
  type: "button";
};

export type UseInfiniteScrollResult<TElement extends Element> = {
  /** Props for an app-rendered `<button>` that loads (or retries) through the same guards. */
  getLoadMoreProps: () => InfiniteScrollLoadMoreProps;
  loadMore: () => void;
  ref: React.RefCallback<TElement>;
  /** Whether the current mode and state call for rendering the manual control. */
  showManualControl: boolean;
  status: InfiniteScrollStatus;
};

function infiniteScrollStatus({
  enabled,
  hasMore,
  isError,
  isLoading,
}: {
  enabled: boolean;
  hasMore: boolean;
  isError: boolean;
  isLoading: boolean;
}): InfiniteScrollStatus {
  if (isLoading) {
    return "loading";
  }
  if (!hasMore) {
    return "exhausted";
  }
  if (!enabled) {
    return "disabled";
  }
  return isError ? "error" : "idle";
}

/** False only after mount in environments without `IntersectionObserver`, so SSR markup matches. */
function useObserverSupport(): boolean {
  const [supported, setSupported] = React.useState(true);

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setSupported(false);
    }
  }, []);

  return supported;
}

type GuardState = { enabled: boolean; hasMore: boolean; isLoading: boolean; onLoad: () => void };

/**
 * Returns a load function guarded by `enabled`, `hasMore` and `isLoading`. It also latches
 * after a call until the next commit, so rapid observer callbacks or a manual trigger firing
 * before the consumer re-renders with `isLoading` cannot load the same page twice.
 */
function useGuardedLoad(state: GuardState, beforeLoad?: () => void): () => void {
  const stateRef = React.useRef(state);
  const inFlightRef = React.useRef(false);
  const beforeLoadRef = React.useRef(beforeLoad);

  // Sync during commit so an abandoned concurrent render never leaks into observer callbacks.
  React.useLayoutEffect(() => {
    stateRef.current = state;
    beforeLoadRef.current = beforeLoad;
    inFlightRef.current = false;
  });

  return React.useCallback(() => {
    const current = stateRef.current;
    if (inFlightRef.current || !current.enabled || !current.hasMore || current.isLoading) {
      return;
    }

    inFlightRef.current = true;
    beforeLoadRef.current?.();
    current.onLoad();
  }, []);
}

type SentinelObserverOptions = {
  active: boolean;
  load: () => void;
  root: Element | Document | null;
  rootMargin: string;
  target: Element | null;
  threshold: number;
};

function useSentinelObserver({
  active,
  load,
  root,
  rootMargin,
  target,
  threshold,
}: SentinelObserverOptions) {
  React.useEffect(() => {
    if (!target || !active || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          load();
        }
      },
      { root, rootMargin, threshold },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [active, load, root, rootMargin, target, threshold]);
}

function useInfiniteScroll<TElement extends Element = HTMLDivElement>({
  enabled = true,
  hasMore,
  isError = false,
  isLoading = false,
  mode = "automatic",
  onLoadMore,
  root = null,
  rootMargin = "0px 0px 400px 0px",
  threshold = 0,
}: UseInfiniteScrollOptions): UseInfiniteScrollResult<TElement> {
  const [target, setTarget] = React.useState<TElement | null>(null);
  const observerSupported = useObserverSupport();
  const loadMore = useGuardedLoad({ enabled, hasMore, isLoading, onLoad: onLoadMore });
  const status = infiniteScrollStatus({ enabled, hasMore, isError, isLoading });

  useSentinelObserver({
    active: mode !== "manual" && status === "idle",
    load: loadMore,
    root,
    rootMargin,
    target,
    threshold,
  });

  const showManualControl =
    status !== "exhausted" &&
    (mode === "manual" || (mode === "automatic-with-fallback" && (!observerSupported || isError)));

  const getLoadMoreProps = React.useCallback(
    (): InfiniteScrollLoadMoreProps => ({
      "aria-busy": status === "loading",
      "data-slot": "infinite-scroll-load-more",
      "data-state": status,
      disabled: status !== "idle" && status !== "error",
      onClick: loadMore,
      type: "button",
    }),
    [loadMore, status],
  );

  return { getLoadMoreProps, loadMore, ref: setTarget, showManualControl, status };
}

export type InfiniteScrollDirectionOptions = {
  hasMore: boolean;
  isLoading?: boolean;
  onLoad: () => void;
  /** Defaults to 400px beyond the sentinel's edge of the viewport in this direction. */
  rootMargin?: string;
};

export type UseBidirectionalInfiniteScrollOptions = {
  enabled?: boolean;
  /** Loads pages after the current content; the sentinel goes after the last item. */
  next?: InfiniteScrollDirectionOptions;
  /** Loads pages before the current content; the sentinel goes before the first item. */
  previous?: InfiniteScrollDirectionOptions;
  /** Observer root when no scroll container is attached through `scrollRef`. */
  root?: Element | Document | null;
  threshold?: number;
};

export type UseBidirectionalInfiniteScrollResult<TElement extends Element> = {
  loadNext: () => void;
  loadPrevious: () => void;
  nextRef: React.RefCallback<TElement>;
  previousRef: React.RefCallback<TElement>;
  /** Attach to the scroll container so prepended pages keep the visible content in place. */
  scrollRef: React.RefCallback<HTMLElement>;
};

/**
 * Infinite scrolling in both directions for chat history, logs and feeds entered mid-way.
 * Each direction has its own sentinel, guards and loading state, so one never triggers the
 * other. When a previous page is prepended, the scroll container keeps its distance from the
 * bottom, so the content the user was looking at stays put.
 */
function useBidirectionalInfiniteScroll<TElement extends Element = HTMLDivElement>({
  enabled = true,
  next,
  previous,
  root = null,
  threshold = 0,
}: UseBidirectionalInfiniteScrollOptions): UseBidirectionalInfiniteScrollResult<TElement> {
  const [nextTarget, setNextTarget] = React.useState<TElement | null>(null);
  const [previousTarget, setPreviousTarget] = React.useState<TElement | null>(null);
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  // Distance from the bottom of the content while a previous page is pending; null otherwise.
  const anchorRef = React.useRef<number | null>(null);
  const previousLoading = previous?.isLoading ?? false;

  const loadNext = useGuardedLoad({
    enabled,
    hasMore: next?.hasMore ?? false,
    isLoading: next?.isLoading ?? false,
    onLoad: next?.onLoad ?? noop,
  });
  const loadPrevious = useGuardedLoad(
    {
      enabled,
      hasMore: previous?.hasMore ?? false,
      isLoading: previousLoading,
      onLoad: previous?.onLoad ?? noop,
    },
    () => {
      anchorRef.current = container ? container.scrollHeight - container.scrollTop : null;
    },
  );

  // Track user scrolling while a previous page is pending so the anchor follows the user.
  React.useEffect(() => {
    if (!container) {
      return;
    }

    const onScroll = () => {
      if (anchorRef.current !== null) {
        anchorRef.current = container.scrollHeight - container.scrollTop;
      }
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [container]);

  // Restore the anchor in the commit that renders the prepended page, before paint. Runs
  // before the observers re-arm, so the top sentinel is already out of view by then.
  React.useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (anchor === null || previousLoading || !container) {
      return;
    }

    anchorRef.current = null;
    container.scrollTop = container.scrollHeight - anchor;
  });

  const observerRoot = container ?? root;

  useSentinelObserver({
    active: enabled && (next?.hasMore ?? false) && !(next?.isLoading ?? false),
    load: loadNext,
    root: observerRoot,
    rootMargin: next?.rootMargin ?? "0px 0px 400px 0px",
    target: nextTarget,
    threshold,
  });
  useSentinelObserver({
    active: enabled && (previous?.hasMore ?? false) && !previousLoading,
    load: loadPrevious,
    root: observerRoot,
    rootMargin: previous?.rootMargin ?? "400px 0px 0px 0px",
    target: previousTarget,
    threshold,
  });

  return {
    loadNext,
    loadPrevious,
    nextRef: setNextTarget,
    previousRef: setPreviousTarget,
    scrollRef: setContainer,
  };
}

function noop() {}

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
      isError,
      isLoading = false,
      mode,
      onLoadMore,
      root,
      rootMargin,
      threshold,
      ...props
    },
    forwardedRef,
  ) {
    const { ref, status } = useInfiniteScroll<HTMLDivElement>({
      enabled,
      hasMore,
      isError,
      isLoading,
      mode,
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
        data-state={status}
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

export {
  InfiniteScrollTrigger,
  useBidirectionalInfiniteScroll,
  useInfiniteScroll,
  useInfiniteScrollRestoration,
};
