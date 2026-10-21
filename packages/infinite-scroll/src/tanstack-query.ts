import type { InfiniteScrollDirectionOptions, UseInfiniteScrollOptions } from "./react";

type FetchPage = (options?: { cancelRefetch?: boolean }) => Promise<unknown>;

/** The `useInfiniteQuery` result fields the next-page adapter reads. */
export type InfiniteQueryNextPageState = {
  fetchNextPage: FetchPage;
  hasNextPage: boolean;
  isFetchNextPageError: boolean;
  isFetching: boolean;
};

/** The `useInfiniteQuery` result fields the previous-page adapter reads. */
export type InfiniteQueryPreviousPageState = {
  fetchPreviousPage: FetchPage;
  hasPreviousPage: boolean;
  isFetching: boolean;
};

export type InfiniteQueryScrollOptions = Required<
  Pick<UseInfiniteScrollOptions, "hasMore" | "isError" | "isLoading" | "onLoadMore">
>;

export type InfiniteQueryScrollDirections = {
  next: InfiniteScrollDirectionOptions;
  previous: InfiniteScrollDirectionOptions;
};

// TanStack Query pages are fetched one at a time per query: a page fetch during a refetch
// (or the other direction's fetch) would be dropped or would overwrite fresh data. So any
// fetch counts as loading, and `cancelRefetch: false` makes a repeated call join the
// in-flight fetch instead of cancelling and restarting it.
const joinInFlight = { cancelRefetch: false } as const;

/**
 * Maps a `useInfiniteQuery` result onto `useInfiniteScroll` / `InfiniteScrollTrigger` options.
 * Errors stay on the query; `isError` only pauses automatic loading after a failed page.
 *
 * ```tsx
 * const { ref } = useInfiniteScroll(infiniteQueryScrollOptions(query));
 * ```
 */
function infiniteQueryScrollOptions(query: InfiniteQueryNextPageState): InfiniteQueryScrollOptions {
  return {
    hasMore: query.hasNextPage,
    isError: query.isFetchNextPageError,
    isLoading: query.isFetching,
    onLoadMore: () => {
      void query.fetchNextPage(joinInFlight);
    },
  };
}

/**
 * Maps a bidirectional `useInfiniteQuery` result (with `getPreviousPageParam`) onto
 * `useBidirectionalInfiniteScroll` options.
 *
 * ```tsx
 * const { scrollRef, previousRef, nextRef } = useBidirectionalInfiniteScroll(
 *   infiniteQueryScrollDirections(query),
 * );
 * ```
 */
function infiniteQueryScrollDirections(
  query: InfiniteQueryNextPageState & InfiniteQueryPreviousPageState,
): InfiniteQueryScrollDirections {
  return {
    next: {
      hasMore: query.hasNextPage,
      isLoading: query.isFetching,
      onLoad: () => {
        void query.fetchNextPage(joinInFlight);
      },
    },
    previous: {
      hasMore: query.hasPreviousPage,
      isLoading: query.isFetching,
      onLoad: () => {
        void query.fetchPreviousPage(joinInFlight);
      },
    },
  };
}

export { infiniteQueryScrollDirections, infiniteQueryScrollOptions };
