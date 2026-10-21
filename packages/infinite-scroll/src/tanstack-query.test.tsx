import { QueryClient, QueryClientProvider, useInfiniteQuery } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { CursorPage } from "./core";
import { useInfiniteScroll } from "./react";
import { infiniteQueryScrollDirections, infiniteQueryScrollOptions } from "./tanstack-query";

type Observer = { callback: IntersectionObserverCallback; disconnected: boolean; target?: Element };

const observers: Observer[] = [];

class MockIntersectionObserver {
  private readonly record: Observer;

  constructor(callback: IntersectionObserverCallback) {
    this.record = { callback, disconnected: false };
    observers.push(this.record);
  }

  disconnect() {
    this.record.disconnected = true;
  }

  observe(target: Element) {
    this.record.target = target;
  }
}

function activeObservers() {
  return observers.filter((observer) => !observer.disconnected);
}

function intersectActive() {
  act(() => {
    for (const { callback, target } of activeObservers()) {
      callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    }
  });
}

type Page = CursorPage<number, number>;

function deferredPages() {
  const pending: Array<{ cursor: number; resolve: (page: Page) => void; reject: () => void }> = [];
  const queryFn = vi.fn(
    ({ pageParam }: { pageParam: number }) =>
      new Promise<Page>((resolve, reject) => {
        pending.push({ cursor: pageParam, reject: () => reject(new Error("boom")), resolve });
      }),
  );
  return { pending, queryFn };
}

function Feed({
  lastCursor,
  queryFn,
}: {
  lastCursor: number;
  queryFn: (context: { pageParam: number }) => Promise<Page>;
}) {
  const query = useInfiniteQuery({
    getNextPageParam: (page: Page) => page.nextCursor,
    initialPageParam: 0,
    queryFn,
    queryKey: ["feed", lastCursor],
    retry: false,
  });
  const { ref, status } = useInfiniteScroll(infiniteQueryScrollOptions(query));

  return (
    <div data-status={status}>
      <span data-testid="pages">{query.data?.pages.length ?? 0}</span>
      <div ref={ref} />
    </div>
  );
}

function renderFeed(lastCursor: number) {
  const { pending, queryFn } = deferredPages();
  const client = new QueryClient();
  const view = render(
    <QueryClientProvider client={client}>
      <Feed lastCursor={lastCursor} queryFn={queryFn} />
    </QueryClientProvider>,
  );
  const resolve = async (index: number) => {
    const { cursor, resolve: settle } = pending[index]!;
    await act(async () => {
      settle({ items: [cursor], nextCursor: cursor < lastCursor ? cursor + 1 : null });
    });
  };
  const status = () => view.container.firstElementChild?.getAttribute("data-status");
  const pageCount = () => Number(view.getByTestId("pages").textContent);
  return { pageCount, pending, queryFn, resolve, status };
}

describe("TanStack Query adapter", () => {
  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("fetches the next page once per loading cycle despite repeated notifications", async () => {
    const feed = renderFeed(2);
    await waitFor(() => expect(feed.pending).toHaveLength(1));
    expect(activeObservers()).toHaveLength(0);
    await feed.resolve(0);
    await waitFor(() => expect(feed.status()).toBe("idle"));

    intersectActive();
    intersectActive();
    await waitFor(() => expect(feed.status()).toBe("loading"));
    intersectActive();

    expect(feed.queryFn).toHaveBeenCalledTimes(2);
    expect(feed.pending[1]?.cursor).toBe(1);
    await feed.resolve(1);
    await waitFor(() => expect(feed.pageCount()).toBe(2));
  });

  test("stops observing once pagination is exhausted", async () => {
    const feed = renderFeed(0);
    await waitFor(() => expect(feed.pending).toHaveLength(1));
    await feed.resolve(0);

    await waitFor(() => expect(feed.status()).toBe("exhausted"));
    expect(activeObservers()).toHaveLength(0);
    expect(feed.queryFn).toHaveBeenCalledTimes(1);
  });

  test("leaves a failed page on the query and pauses automatic loading", async () => {
    const feed = renderFeed(2);
    await waitFor(() => expect(feed.pending).toHaveLength(1));
    await feed.resolve(0);
    await waitFor(() => expect(feed.status()).toBe("idle"));

    intersectActive();
    await waitFor(() => expect(feed.pending).toHaveLength(2));
    await act(async () => feed.pending[1]!.reject());

    await waitFor(() => expect(feed.status()).toBe("error"));
    expect(activeObservers()).toHaveLength(0);
    expect(feed.pageCount()).toBe(1);
  });

  test("forwards both directions without cancelling an in-flight fetch", () => {
    const query = {
      fetchNextPage: vi.fn(async () => undefined),
      fetchPreviousPage: vi.fn(async () => undefined),
      hasNextPage: true,
      hasPreviousPage: false,
      isFetchNextPageError: false,
      isFetching: true,
    };

    expect(infiniteQueryScrollOptions(query)).toMatchObject({
      hasMore: true,
      isError: false,
      isLoading: true,
    });

    const { next, previous } = infiniteQueryScrollDirections(query);
    expect(previous).toMatchObject({ hasMore: false, isLoading: true });
    next.onLoad();
    previous.onLoad();
    infiniteQueryScrollOptions(query).onLoadMore();

    expect(query.fetchNextPage).toHaveBeenCalledTimes(2);
    expect(query.fetchNextPage).toHaveBeenCalledWith({ cancelRefetch: false });
    expect(query.fetchPreviousPage).toHaveBeenCalledWith({ cancelRefetch: false });
  });
});
