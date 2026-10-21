import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { useInfiniteScroll, type UseInfiniteScrollOptions } from "./react";

const observerCallbacks: IntersectionObserverCallback[] = [];

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    observerCallbacks.push(callback);
  }

  disconnect() {}

  observe() {}
}

function Feed({
  alwaysShowButton = false,
  ...options
}: UseInfiniteScrollOptions & { alwaysShowButton?: boolean }) {
  const { getLoadMoreProps, ref, showManualControl } = useInfiniteScroll(options);

  return (
    <>
      <div ref={ref} />
      {showManualControl || alwaysShowButton ? (
        <button {...getLoadMoreProps()}>Load more</button>
      ) : null}
    </>
  );
}

describe("manual load-more fallback", () => {
  afterEach(() => {
    observerCallbacks.length = 0;
    vi.unstubAllGlobals();
  });

  test("manual mode loads only from the keyboard-accessible button", () => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    const onLoadMore = vi.fn();
    const { getByRole } = render(<Feed hasMore mode="manual" onLoadMore={onLoadMore} />);

    expect(observerCallbacks).toHaveLength(0);
    const button = getByRole("button", { name: "Load more" });
    expect(button.getAttribute("type")).toBe("button");
    fireEvent.click(button);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  test("manual mode works without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const onLoadMore = vi.fn();
    const { getByRole } = render(<Feed hasMore mode="manual" onLoadMore={onLoadMore} />);

    fireEvent.click(getByRole("button"));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  test("fallback mode offers the button only when IntersectionObserver is missing", () => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    const supported = render(<Feed hasMore mode="automatic-with-fallback" onLoadMore={vi.fn()} />);
    expect(supported.queryByRole("button")).toBeNull();
    supported.unmount();

    vi.stubGlobal("IntersectionObserver", undefined);
    const onLoadMore = vi.fn();
    const unsupported = render(
      <Feed hasMore mode="automatic-with-fallback" onLoadMore={onLoadMore} />,
    );
    fireEvent.click(unsupported.getByRole("button"));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  test("automatic and manual triggers together load once", () => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    const onLoadMore = vi.fn();
    const { getByRole } = render(<Feed hasMore mode="manual" onLoadMore={onLoadMore} />);
    const button = getByRole("button");

    act(() => {
      button.click();
      button.click();
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    const auto = render(<Feed alwaysShowButton hasMore onLoadMore={onLoadMore} />);
    act(() => {
      observerCallbacks.at(-1)!(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      auto.container.querySelector("button")!.click();
    });
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  test("loading and exhausted states disable or hide the control", () => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    const onLoadMore = vi.fn();
    const { getByRole, queryByRole, rerender } = render(
      <Feed hasMore isLoading mode="manual" onLoadMore={onLoadMore} />,
    );

    const button = getByRole("button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.dataset.state).toBe("loading");
    fireEvent.click(button);
    expect(onLoadMore).not.toHaveBeenCalled();

    rerender(<Feed hasMore={false} mode="manual" onLoadMore={onLoadMore} />);
    expect(queryByRole("button")).toBeNull();
  });

  test("a failed load pauses automatic loading and the button retries", () => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    const onLoadMore = vi.fn();
    const { getByRole } = render(
      <Feed hasMore isError mode="automatic-with-fallback" onLoadMore={onLoadMore} />,
    );

    expect(observerCallbacks).toHaveLength(0);
    const button = getByRole("button") as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(button.dataset.state).toBe("error");
    fireEvent.click(button);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
