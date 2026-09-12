import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { flattenCursorPages, hasNextCursor } from "./core";
import { InfiniteScrollTrigger } from "./react";

type ObserverRecord = {
  callback: IntersectionObserverCallback;
  instance: MockIntersectionObserver;
  options?: IntersectionObserverInit;
  target?: Element;
};

const observerRecords: ObserverRecord[] = [];

class MockIntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [0];
  private readonly record: ObserverRecord;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.record = { callback, instance: this, options };
    observerRecords.push(this.record);
  }

  disconnect() {}

  observe(target: Element) {
    this.record.target = target;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve() {}
}

function intersect(record: ObserverRecord) {
  const target = record.target;
  if (!target) {
    throw new Error("Observer has no target");
  }

  act(() => {
    record.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      record.instance as unknown as IntersectionObserver,
    );
  });
}

describe("@moritzbrantner/infinite-scroll", () => {
  beforeEach(() => {
    observerRecords.length = 0;
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("flattens cursor pages and reports whether another cursor exists", () => {
    const pages = [
      { items: ["a", "b"], nextCursor: "page-2" },
      { items: ["c"], nextCursor: null },
    ];

    expect(flattenCursorPages(pages)).toEqual(["a", "b", "c"]);
    expect(hasNextCursor(pages[0]!)).toBe(true);
    expect(hasNextCursor(pages[1]!)).toBe(false);
  });

  test("loads when the sentinel enters the configured prefetch boundary", () => {
    const onLoadMore = vi.fn();

    const { container } = render(
      <InfiniteScrollTrigger hasMore onLoadMore={onLoadMore} data-testid="sentinel" />,
    );

    expect(observerRecords).toHaveLength(1);
    expect(observerRecords[0]!.options).toMatchObject({
      root: null,
      rootMargin: "0px 0px 400px 0px",
      threshold: 0,
    });
    expect(container.querySelector('[data-slot="infinite-scroll-trigger"]')).toBeTruthy();

    intersect(observerRecords[0]!);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  test("does not observe while disabled, loading, or complete", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <InfiniteScrollTrigger hasMore isLoading onLoadMore={onLoadMore} />,
    );

    expect(observerRecords).toHaveLength(0);

    rerender(<InfiniteScrollTrigger hasMore={false} onLoadMore={onLoadMore} />);
    expect(observerRecords).toHaveLength(0);

    rerender(<InfiniteScrollTrigger hasMore enabled={false} onLoadMore={onLoadMore} />);
    expect(observerRecords).toHaveLength(0);
  });

  test("re-arms after a loading cycle so short pages can continue filling the viewport", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <InfiniteScrollTrigger hasMore onLoadMore={onLoadMore} />,
    );

    intersect(observerRecords[0]!);
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender(<InfiniteScrollTrigger hasMore isLoading onLoadMore={onLoadMore} />);
    rerender(<InfiniteScrollTrigger hasMore onLoadMore={onLoadMore} />);

    expect(observerRecords).toHaveLength(2);
    intersect(observerRecords[1]!);
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });
});
