"use client";

import * as React from "react";

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

  stateRef.current = { enabled, hasMore, isLoading, onLoadMore };

  const loadMore = React.useCallback(() => {
    const state = stateRef.current;
    if (!state.enabled || !state.hasMore || state.isLoading) {
      return;
    }

    state.onLoadMore();
  }, []);

  React.useEffect(() => {
    if (!target || !enabled || !hasMore || isLoading || typeof IntersectionObserver === "undefined") {
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

export { InfiniteScrollTrigger, useInfiniteScroll };
