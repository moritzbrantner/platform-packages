import { useVirtualizer } from "@tanstack/react-virtual";
import { act, render } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useInfiniteScroll } from "./react";

// Harness for the README's TanStack Virtual example: only the virtual window is rendered,
// and the sentinel sits after the sized inner element, outside the virtual rows.

type Observer = {
  callback: IntersectionObserverCallback;
  disconnected: boolean;
  options?: IntersectionObserverInit;
  target?: Element;
};

const observers: Observer[] = [];

class MockIntersectionObserver {
  private readonly record: Observer;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.record = { callback, disconnected: false, options };
    observers.push(this.record);
  }

  disconnect() {
    this.record.disconnected = true;
  }

  observe(target: Element) {
    this.record.target = target;
  }
}

function activeObserver() {
  return observers.find((observer) => !observer.disconnected);
}

function intersect() {
  const observer = activeObserver();
  act(() => {
    observer?.callback(
      [{ isIntersecting: true, target: observer.target } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
}

const PAGE_SIZE = 100;
const ROW_HEIGHT = 30;

type LoadMore = (pageCount: number, resolve: () => void) => void;

function VirtualFeed({ onLoadMore }: { onLoadMore: LoadMore }) {
  const [rows, setRows] = React.useState(() => Array.from({ length: PAGE_SIZE }, (_, i) => i));
  const [isLoading, setIsLoading] = React.useState(false);
  const [scrollElement, setScrollElement] = React.useState<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => ROW_HEIGHT,
    getScrollElement: () => scrollElement,
    overscan: 5,
  });

  const { ref } = useInfiniteScroll({
    hasMore: rows.length < 3 * PAGE_SIZE,
    isLoading,
    onLoadMore: () => {
      setIsLoading(true);
      onLoadMore(rows.length / PAGE_SIZE, () => {
        setRows((current) => [
          ...current,
          ...Array.from({ length: PAGE_SIZE }, (_, i) => current.length + i),
        ]);
        setIsLoading(false);
      });
    },
    root: scrollElement,
    rootMargin: "0px 0px 600px 0px",
  });

  return (
    <div ref={setScrollElement} data-testid="scroll" style={{ height: 300, overflowY: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            data-row={rows[item.index]}
            style={{ height: item.size, position: "absolute", top: item.start, width: "100%" }}
          />
        ))}
      </div>
      <div ref={ref} data-testid="sentinel" />
    </div>
  );
}

describe("TanStack Virtual interop", () => {
  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    // jsdom has no layout; give the scroll container a 300px viewport.
    vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(300);
    vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(300);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("renders only the virtual window and observes a sentinel outside it", () => {
    const { container, getByTestId } = render(<VirtualFeed onLoadMore={vi.fn()} />);

    const rendered = container.querySelectorAll("[data-row]").length;
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(PAGE_SIZE / 2);
    expect(activeObserver()?.target).toBe(getByTestId("sentinel"));
    expect(activeObserver()?.options?.root).toBe(getByTestId("scroll"));
  });

  test("requests the next page once per loading cycle and stops when exhausted", () => {
    let resolve = () => {};
    const onLoadMore = vi.fn<LoadMore>((_, settle) => {
      resolve = settle;
    });
    render(<VirtualFeed onLoadMore={onLoadMore} />);
    const resolvePage = () => act(() => resolve());

    // Overscan re-renders and repeated notifications while a page loads do not fetch again.
    intersect();
    intersect();
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(activeObserver()).toBeUndefined();

    resolvePage();
    intersect();
    intersect();
    expect(onLoadMore).toHaveBeenCalledTimes(2);
    expect(onLoadMore.mock.calls[1]?.[0]).toBe(2);

    resolvePage();
    expect(activeObserver()).toBeUndefined();
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });
});
