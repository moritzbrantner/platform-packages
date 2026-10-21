import { act, render } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { hasPreviousCursor } from "./core";
import { useBidirectionalInfiniteScroll, type InfiniteScrollDirectionOptions } from "./react";

type ObserverRecord = {
  callback: IntersectionObserverCallback;
  disconnected: boolean;
  instance: MockIntersectionObserver;
  options?: IntersectionObserverInit;
  target?: Element;
};

const observerRecords: ObserverRecord[] = [];

class MockIntersectionObserver {
  private readonly record: ObserverRecord;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.record = { callback, disconnected: false, instance: this, options };
    observerRecords.push(this.record);
  }

  disconnect() {
    this.record.disconnected = true;
  }

  observe(target: Element) {
    this.record.target = target;
  }
}

function activeObserver(testId: string): ObserverRecord {
  const record = observerRecords.find(
    (candidate) =>
      !candidate.disconnected && candidate.target?.getAttribute("data-testid") === testId,
  );
  if (!record) {
    throw new Error(`No active observer for ${testId}`);
  }
  return record;
}

function hasActiveObserver(testId: string): boolean {
  return observerRecords.some(
    (candidate) =>
      !candidate.disconnected && candidate.target?.getAttribute("data-testid") === testId,
  );
}

function intersect(testId: string) {
  const record = activeObserver(testId);
  act(() => {
    record.callback(
      [{ isIntersecting: true, target: record.target! } as IntersectionObserverEntry],
      record.instance as unknown as IntersectionObserver,
    );
  });
}

type FeedProps = {
  next?: InfiniteScrollDirectionOptions;
  previous?: InfiniteScrollDirectionOptions;
  items?: readonly string[];
};

function Feed({ items = [], next, previous }: FeedProps) {
  const scroll = useBidirectionalInfiniteScroll({ next, previous });

  return (
    <div ref={scroll.scrollRef} data-testid="container">
      <div ref={scroll.previousRef} data-testid="previous" />
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
      <div ref={scroll.nextRef} data-testid="next" />
    </div>
  );
}

describe("useBidirectionalInfiniteScroll", () => {
  beforeEach(() => {
    observerRecords.length = 0;
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("reports previous cursors independently of next cursors", () => {
    expect(hasPreviousCursor({ previousCursor: "page-0" })).toBe(true);
    expect(hasPreviousCursor({ previousCursor: null })).toBe(false);
    expect(hasPreviousCursor({})).toBe(false);
  });

  test("forward-only feeds observe only the bottom sentinel", () => {
    const onLoad = vi.fn();
    render(<Feed next={{ hasMore: true, onLoad }} />);

    expect(hasActiveObserver("previous")).toBe(false);
    expect(activeObserver("next").options?.rootMargin).toBe("0px 0px 400px 0px");
    intersect("next");
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  test("backward-only feeds observe only the top sentinel", () => {
    const onLoad = vi.fn();
    render(<Feed previous={{ hasMore: true, onLoad }} />);

    expect(hasActiveObserver("next")).toBe(false);
    expect(activeObserver("previous").options?.rootMargin).toBe("400px 0px 0px 0px");
    intersect("previous");
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  test("loading one direction never triggers or blocks the other", () => {
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    const { rerender } = render(
      <Feed
        next={{ hasMore: true, onLoad: onNext }}
        previous={{ hasMore: true, onLoad: onPrevious }}
      />,
    );

    intersect("previous");
    rerender(
      <Feed
        next={{ hasMore: true, onLoad: onNext }}
        previous={{ hasMore: true, isLoading: true, onLoad: onPrevious }}
      />,
    );

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
    expect(hasActiveObserver("previous")).toBe(false);

    intersect("next");
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  test("exhausted cursors stop observing that direction only", () => {
    render(
      <Feed
        next={{ hasMore: false, onLoad: vi.fn() }}
        previous={{ hasMore: true, onLoad: vi.fn() }}
      />,
    );

    expect(hasActiveObserver("next")).toBe(false);
    expect(hasActiveObserver("previous")).toBe(true);
  });

  test("rapid observer callbacks load once until the consumer re-renders", () => {
    const onLoad = vi.fn();
    const { rerender } = render(<Feed previous={{ hasMore: true, onLoad }} />);
    const record = activeObserver("previous");

    act(() => {
      const entry = [{ isIntersecting: true, target: record.target! } as IntersectionObserverEntry];
      record.callback(entry, record.instance as unknown as IntersectionObserver);
      record.callback(entry, record.instance as unknown as IntersectionObserver);
    });
    expect(onLoad).toHaveBeenCalledTimes(1);

    rerender(<Feed previous={{ hasMore: true, onLoad }} />);
    intersect("previous");
    expect(onLoad).toHaveBeenCalledTimes(2);
  });

  test("prepending a previous page keeps the visible content in place", () => {
    let scrollHeight = 1000;
    const onLoad = vi.fn();
    const { getByTestId, rerender } = render(
      <Feed items={["c", "d"]} previous={{ hasMore: true, onLoad }} />,
    );
    const container = getByTestId("container");
    Object.defineProperty(container, "scrollHeight", { get: () => scrollHeight });
    container.scrollTop = 120;

    intersect("previous");
    rerender(<Feed items={["c", "d"]} previous={{ hasMore: true, isLoading: true, onLoad }} />);
    expect(container.scrollTop).toBe(120);

    scrollHeight = 1600;
    rerender(<Feed items={["a", "b", "c", "d"]} previous={{ hasMore: false, onLoad }} />);

    expect(container.scrollTop).toBe(720);
  });

  test("appending a next page leaves the scroll position alone", () => {
    let scrollHeight = 1000;
    const onLoad = vi.fn();
    const { getByTestId, rerender } = render(
      <Feed
        items={["a"]}
        next={{ hasMore: true, onLoad }}
        previous={{ hasMore: true, onLoad: vi.fn() }}
      />,
    );
    const container = getByTestId("container");
    Object.defineProperty(container, "scrollHeight", { get: () => scrollHeight });
    container.scrollTop = 300;

    intersect("next");
    scrollHeight = 1500;
    rerender(
      <Feed
        items={["a", "b"]}
        next={{ hasMore: true, onLoad }}
        previous={{ hasMore: true, onLoad: vi.fn() }}
      />,
    );

    expect(container.scrollTop).toBe(300);
  });
});
