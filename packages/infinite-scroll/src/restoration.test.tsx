/// <reference types="node" />
/**
 * Acceptance contract for #77 "Add scroll restoration to infinite-scroll".
 *
 * Assumed public API (opt-in, storage-agnostic, no routing ownership):
 *
 * Core (`@moritzbrantner/infinite-scroll` and `/core`, framework-neutral):
 *
 *   type InfiniteScrollRestorationState<TItem, TCursor = string> = {
 *     version: 1;
 *     pages: readonly CursorPage<TItem, TCursor>[];   // already-loaded pages, restored without refetching
 *     pageParams: readonly (TCursor | null)[];        // cursor used to load each page (TanStack `pageParams`)
 *     scrollOffset: number;                           // px from the top of the scroll container
 *     contentKey?: string;                            // app-defined content/version fingerprint
 *   };
 *
 *   interface InfiniteScrollRestorationStorage {      // adapter: memory, session storage, URL, router state…
 *     get(key: string): unknown;
 *     set(key: string, value: unknown): void;
 *     remove(key: string): void;
 *   }
 *
 *   createMemoryRestorationStorage(): InfiniteScrollRestorationStorage;
 *   createWebStorageRestorationStorage(
 *     storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
 *   ): InfiniteScrollRestorationStorage;               // JSON-serialises; corrupt entries read as missing
 *
 *   saveInfiniteScrollRestoration<TItem, TCursor>(storage, key, {
 *     pages, scrollOffset, pageParams?, contentKey?,
 *   }): InfiniteScrollRestorationState<TItem, TCursor>;
 *     // pageParams defaults to [null, ...pages.slice(0, -1).map((page) => page.nextCursor)]
 *   readInfiniteScrollRestoration<TItem, TCursor>(storage, key, {
 *     contentKey?, maxPages?,
 *   }?): InfiniteScrollRestorationState<TItem, TCursor> | null;
 *   clearInfiniteScrollRestoration(storage, key): void;
 *
 * React (`@moritzbrantner/infinite-scroll/react`):
 *
 *   useInfiniteScrollRestoration<TItem, TCursor = string>({
 *     key: string;
 *     storage: InfiniteScrollRestorationStorage;
 *     restoredState: InfiniteScrollRestorationState<TItem, TCursor> | null;  // from readInfiniteScrollRestoration
 *     pages: readonly CursorPage<TItem, TCursor>[];                          // pages currently rendered
 *     contentKey?: string;
 *     enabled?: boolean;                                                     // default true
 *   }): {
 *     scrollRef: React.RefCallback<HTMLElement>;  // attach to the scroll container
 *     isRestoring: boolean;                       // true until the saved offset has been applied
 *     save: () => void;                           // persist current pages + offset now
 *   };
 *
 * Rules encoded below:
 * - Missing, malformed or unknown-version state reads as `null` → normal first load.
 * - Changed content: when the reader passes a `contentKey` that differs from the saved one
 *   (or the saved state has none), the state is discarded (`null`) → fresh first load.
 * - Changed page counts: `maxPages` truncates the saved pages/pageParams to the first N pages;
 *   when the restored content is shorter than the saved offset, the applied offset is clamped
 *   to the container's maximum scroll offset (scrollHeight - clientHeight) instead of jumping to top.
 * - The offset is applied exactly once, in the first commit where the rendered `pages` contain at
 *   least as many pages as `restoredState.pages` and the container is attached; never before.
 * - The hook saves on unmount (latest pages + last observed scroll offset) and via `save()`;
 *   with `enabled: false` it neither applies nor writes anything.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { act, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  clearInfiniteScrollRestoration,
  createMemoryRestorationStorage,
  createWebStorageRestorationStorage,
  readInfiniteScrollRestoration,
  saveInfiniteScrollRestoration,
  type CursorPage,
  type InfiniteScrollRestorationState,
  type InfiniteScrollRestorationStorage,
} from "./core";
import { InfiniteScrollTrigger, useInfiniteScrollRestoration } from "./react";

type Post = { id: string };
type PostsPage = CursorPage<Post, string>;

const PAGE_SIZE = 3;
const ITEM_HEIGHT = 100;
const VIEWPORT_HEIGHT = 300;

function makePage(pageIndex: number, nextCursor: string | null): PostsPage {
  return {
    items: Array.from({ length: PAGE_SIZE }, (_, itemIndex) => ({
      id: `p${pageIndex}-${itemIndex}`,
    })),
    nextCursor,
  };
}

/** Three loaded pages: page 1 (cursor null), page 2 (cursor-1), page 3 (cursor-2), next is cursor-3. */
const threePages: PostsPage[] = [
  makePage(1, "cursor-1"),
  makePage(2, "cursor-2"),
  makePage(3, "cursor-3"),
];

// --- IntersectionObserver mock (same approach as index.test.tsx) ---------------------------

type ObserverRecord = {
  callback: IntersectionObserverCallback;
  instance: MockIntersectionObserver;
  target?: Element;
};

const observerRecords: ObserverRecord[] = [];

class MockIntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [0];
  private readonly record: ObserverRecord;

  constructor(callback: IntersectionObserverCallback) {
    this.record = { callback, instance: this };
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

// --- Scroll container instrumentation ----------------------------------------------------
// jsdom has no layout, so each scroll container gets a fake geometry: every rendered item is
// ITEM_HEIGHT tall and the viewport is VIEWPORT_HEIGHT. Every programmatic offset write (via
// scrollTop or scrollTo) is logged together with how many items were in the DOM at that moment.

type ScrollWrite = { itemsRendered: number; value: number };
type ScrollProbe = {
  userScroll: (offset: number) => void;
  writes: ScrollWrite[];
};

const scrollProbes = new Map<string, ScrollProbe>();
const instrumentedNodes = new WeakSet<HTMLElement>();

function instrumentScrollContainer(node: HTMLElement, feedKey: string) {
  if (instrumentedNodes.has(node)) {
    return;
  }
  instrumentedNodes.add(node);

  let top = 0;
  const writes: ScrollWrite[] = [];
  const itemsRendered = () => node.querySelectorAll("[data-item]").length;
  const recordWrite = (value: number) => {
    writes.push({ itemsRendered: itemsRendered(), value });
    top = value;
  };

  Object.defineProperty(node, "scrollTop", {
    configurable: true,
    get: () => top,
    set: (value: number) => recordWrite(value),
  });
  Object.defineProperty(node, "scrollHeight", {
    configurable: true,
    get: () => itemsRendered() * ITEM_HEIGHT,
  });
  Object.defineProperty(node, "clientHeight", {
    configurable: true,
    get: () => VIEWPORT_HEIGHT,
  });
  node.scrollTo = ((optionsOrX?: ScrollToOptions | number, y?: number) => {
    if (typeof optionsOrX === "object" && optionsOrX !== null) {
      if (optionsOrX.top !== undefined) {
        recordWrite(optionsOrX.top);
      }
      return;
    }
    if (y !== undefined) {
      recordWrite(y);
    }
  }) as HTMLElement["scrollTo"];

  scrollProbes.set(feedKey, {
    userScroll: (offset) => {
      top = offset;
      fireEvent.scroll(node);
    },
    writes,
  });
}

function probe(feedKey: string): ScrollProbe {
  const found = scrollProbes.get(feedKey);
  if (!found) {
    throw new Error(`No scroll container rendered for ${feedKey}`);
  }
  return found;
}

// --- Example consumer feed -----------------------------------------------------------------
// Mirrors how an app would wire the API: it reads the restoration state itself (core helper),
// seeds its page state from it, and hands the viewport part to the React hook.

type FeedProps = {
  contentKey?: string;
  enabled?: boolean;
  feedKey: string;
  loadPage: (cursor: string | null) => PostsPage;
  maxPages?: number;
  onRenderItemCount?: (count: number) => void;
  storage: InfiniteScrollRestorationStorage;
};

function Feed({
  contentKey,
  enabled = true,
  feedKey,
  loadPage,
  maxPages,
  onRenderItemCount,
  storage,
}: FeedProps) {
  const [restoredState] = React.useState(() =>
    enabled
      ? readInfiniteScrollRestoration<Post, string>(storage, feedKey, {
          contentKey,
          maxPages,
        })
      : null,
  );
  const [pages, setPages] = React.useState<PostsPage[]>(() =>
    restoredState ? [...restoredState.pages] : [],
  );

  const lastPage = pages[pages.length - 1];
  const hasMore = pages.length === 0 || lastPage?.nextCursor !== null;

  const loadNext = React.useCallback(() => {
    const cursor = pages.length === 0 ? null : (pages[pages.length - 1]!.nextCursor ?? null);
    const page = loadPage(cursor);
    setPages((previous) => [...previous, page]);
  }, [loadPage, pages]);

  React.useEffect(() => {
    if (pages.length === 0) {
      loadNext();
    }
    // Initial load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { isRestoring, save, scrollRef } = useInfiniteScrollRestoration<Post, string>({
    contentKey,
    enabled,
    key: feedKey,
    pages,
    restoredState,
    storage,
  });

  const containerRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        instrumentScrollContainer(node, feedKey);
      }
      scrollRef(node);
    },
    [feedKey, scrollRef],
  );

  const items = pages.flatMap((page) => page.items);
  onRenderItemCount?.(items.length);

  return (
    <div data-restoring={isRestoring ? "true" : "false"} data-testid={feedKey} ref={containerRef}>
      <ul>
        {items.map((item) => (
          <li data-item key={item.id}>
            {item.id}
          </li>
        ))}
      </ul>
      <InfiniteScrollTrigger enabled={!isRestoring} hasMore={hasMore} onLoadMore={loadNext} />
      <span onClick={save} onKeyDown={save} role="button" tabIndex={0}>
        save {feedKey}
      </span>
    </div>
  );
}

/** Feed whose pages arrive from outside (e.g. an async app cache) instead of restoredState. */
function ExternalPagesFeed({
  feedKey,
  pages,
  restoredState,
  storage,
}: {
  feedKey: string;
  pages: readonly PostsPage[];
  restoredState: InfiniteScrollRestorationState<Post, string> | null;
  storage: InfiniteScrollRestorationStorage;
}) {
  const { isRestoring, scrollRef } = useInfiniteScrollRestoration<Post, string>({
    key: feedKey,
    pages,
    restoredState,
    storage,
  });
  const containerRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        instrumentScrollContainer(node, feedKey);
      }
      scrollRef(node);
    },
    [feedKey, scrollRef],
  );

  return (
    <div data-restoring={isRestoring ? "true" : "false"} data-testid={feedKey} ref={containerRef}>
      <ul>
        {pages
          .flatMap((page) => page.items)
          .map((item) => (
            <li data-item key={item.id}>
              {item.id}
            </li>
          ))}
      </ul>
    </div>
  );
}

function pageLoader() {
  return vi.fn((cursor: string | null) => {
    const pageIndex = cursor === null ? 1 : Number(cursor.replace("cursor-", "")) + 1;
    return makePage(pageIndex, `cursor-${pageIndex}`);
  });
}

beforeEach(() => {
  observerRecords.length = 0;
  scrollProbes.clear();
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// --- Core: framework-neutral state and storage --------------------------------------------

describe("restoration state (core)", () => {
  test("save then read round-trips pages, derived cursor metadata, offset and content key", () => {
    const storage = createMemoryRestorationStorage();

    saveInfiniteScrollRestoration(storage, "posts", {
      contentKey: "v1",
      pages: threePages,
      scrollOffset: 640,
    });

    expect(readInfiniteScrollRestoration<Post, string>(storage, "posts")).toMatchObject({
      contentKey: "v1",
      pageParams: [null, "cursor-1", "cursor-2"],
      pages: threePages,
      scrollOffset: 640,
      version: 1,
    });
  });

  test("keeps explicit pageParams instead of deriving them", () => {
    const storage = createMemoryRestorationStorage();

    saveInfiniteScrollRestoration(storage, "posts", {
      pageParams: ["start", "cursor-1", "cursor-2"],
      pages: threePages,
      scrollOffset: 10,
    });

    expect(readInfiniteScrollRestoration(storage, "posts")?.pageParams).toEqual([
      "start",
      "cursor-1",
      "cursor-2",
    ]);
  });

  test("missing state reads as null so the feed falls back to a normal first load", () => {
    const storage = createMemoryRestorationStorage();

    expect(readInfiniteScrollRestoration(storage, "posts")).toBeNull();
  });

  test("independent keys do not interfere, including clearing one of them", () => {
    const storage = createMemoryRestorationStorage();

    saveInfiniteScrollRestoration(storage, "posts", {
      pages: threePages,
      scrollOffset: 640,
    });
    saveInfiniteScrollRestoration(storage, "comments", {
      pages: [makePage(1, null)],
      scrollOffset: 25,
    });

    expect(readInfiniteScrollRestoration(storage, "posts")).toMatchObject({
      pages: threePages,
      scrollOffset: 640,
    });
    expect(readInfiniteScrollRestoration(storage, "comments")).toMatchObject({
      pages: [makePage(1, null)],
      scrollOffset: 25,
    });

    clearInfiniteScrollRestoration(storage, "posts");

    expect(readInfiniteScrollRestoration(storage, "posts")).toBeNull();
    expect(readInfiniteScrollRestoration(storage, "comments")?.scrollOffset).toBe(25);
  });

  test("separate memory storages are isolated from each other", () => {
    const first = createMemoryRestorationStorage();
    const second = createMemoryRestorationStorage();

    saveInfiniteScrollRestoration(first, "posts", {
      pages: threePages,
      scrollOffset: 640,
    });

    expect(readInfiniteScrollRestoration(second, "posts")).toBeNull();
  });

  test("changed content (different contentKey) discards the saved state", () => {
    const storage = createMemoryRestorationStorage();
    saveInfiniteScrollRestoration(storage, "posts", {
      contentKey: "v1",
      pages: threePages,
      scrollOffset: 640,
    });
    saveInfiniteScrollRestoration(storage, "unversioned", {
      pages: threePages,
      scrollOffset: 640,
    });

    expect(readInfiniteScrollRestoration(storage, "posts", { contentKey: "v1" })).not.toBeNull();
    expect(readInfiniteScrollRestoration(storage, "posts", { contentKey: "v2" })).toBeNull();
    expect(
      readInfiniteScrollRestoration(storage, "unversioned", {
        contentKey: "v1",
      }),
    ).toBeNull();
    // A reader that does not care about versions still restores.
    expect(readInfiniteScrollRestoration(storage, "posts")).not.toBeNull();
  });

  test("changed page counts: maxPages truncates saved pages and cursor metadata", () => {
    const storage = createMemoryRestorationStorage();
    saveInfiniteScrollRestoration(storage, "posts", {
      pages: threePages,
      scrollOffset: 800,
    });

    const restored = readInfiniteScrollRestoration<Post, string>(storage, "posts", {
      maxPages: 2,
    });

    expect(restored?.pages).toEqual(threePages.slice(0, 2));
    expect(restored?.pageParams).toEqual([null, "cursor-1"]);
    // The offset is kept; the viewport helper clamps it to the restored content.
    expect(restored?.scrollOffset).toBe(800);
  });

  test.each([
    ["a non-object", "garbage"],
    [
      "an unknown version",
      {
        pageParams: [null],
        pages: [makePage(1, null)],
        scrollOffset: 0,
        version: 2,
      },
    ],
    ["no pages", { pageParams: [], pages: [], scrollOffset: 0, version: 1 }],
    [
      "pages without items",
      {
        pageParams: [null],
        pages: [{ nextCursor: null }],
        scrollOffset: 0,
        version: 1,
      },
    ],
    [
      "a negative offset",
      {
        pageParams: [null],
        pages: [makePage(1, null)],
        scrollOffset: -5,
        version: 1,
      },
    ],
    [
      "a non-finite offset",
      {
        pageParams: [null],
        pages: [makePage(1, null)],
        scrollOffset: Number.NaN,
        version: 1,
      },
    ],
    [
      // Review regression (implementation-authored): CursorPage requires nextCursor.
      "a page without nextCursor",
      {
        pageParams: [null],
        pages: [{ items: [{ id: "p1-0" }] }],
        scrollOffset: 0,
        version: 1,
      },
    ],
    [
      "mismatched pageParams",
      {
        pageParams: [null, "x"],
        pages: [makePage(1, null)],
        scrollOffset: 0,
        version: 1,
      },
    ],
  ])("malformed state (%s) reads as null instead of throwing", (_label, value) => {
    const storage = createMemoryRestorationStorage();
    storage.set("posts", value);

    expect(readInfiniteScrollRestoration(storage, "posts")).toBeNull();
  });

  test("web storage adapter persists JSON and treats corrupt entries as missing", () => {
    const storage = createWebStorageRestorationStorage(window.sessionStorage);

    saveInfiniteScrollRestoration(storage, "posts", {
      pages: threePages,
      scrollOffset: 640,
    });

    expect(window.sessionStorage.length).toBe(1);
    const rawKey = window.sessionStorage.key(0)!;
    expect(rawKey).toContain("posts");
    expect(JSON.parse(window.sessionStorage.getItem(rawKey)!)).toMatchObject({
      pages: threePages,
      scrollOffset: 640,
    });
    expect(readInfiniteScrollRestoration(storage, "posts")).toMatchObject({
      pages: threePages,
      scrollOffset: 640,
    });

    window.sessionStorage.setItem(rawKey, "{not json");
    expect(readInfiniteScrollRestoration(storage, "posts")).toBeNull();

    clearInfiniteScrollRestoration(storage, "posts");
    expect(window.sessionStorage.length).toBe(0);
  });
});

// --- React: viewport save/restore without owning routing ----------------------------------

describe("useInfiniteScrollRestoration (react)", () => {
  test("restores saved pages without refetching them and continues from the saved cursor", () => {
    const storage = createMemoryRestorationStorage();
    saveInfiniteScrollRestoration(storage, "posts", {
      pages: threePages,
      scrollOffset: 450,
    });
    const loadPage = pageLoader();
    const renderedItemCounts: number[] = [];

    render(
      <Feed
        feedKey="posts"
        loadPage={loadPage}
        onRenderItemCount={(count) => renderedItemCounts.push(count)}
        storage={storage}
      />,
    );

    expect(loadPage).not.toHaveBeenCalled();
    expect(renderedItemCounts[0]).toBe(9);
    expect(screen.getAllByText(/^p\d-\d$/)).toHaveLength(9);
    expect(screen.getByTestId("posts").dataset.restoring).toBe("false");

    // Scrolling on loads the *next* page, not page 1 again.
    intersect(observerRecords[observerRecords.length - 1]!);
    expect(loadPage).toHaveBeenCalledTimes(1);
    expect(loadPage).toHaveBeenCalledWith("cursor-3");
  });

  test("applies the saved offset exactly once, only after the restored items are in the DOM", () => {
    const storage = createMemoryRestorationStorage();
    saveInfiniteScrollRestoration(storage, "posts", {
      pages: threePages,
      scrollOffset: 450,
    });

    const { rerender } = render(<Feed feedKey="posts" loadPage={pageLoader()} storage={storage} />);

    expect(probe("posts").writes).toEqual([{ itemsRendered: 9, value: 450 }]);

    // Later renders (e.g. another page arriving) never re-apply or reset the offset.
    rerender(<Feed feedKey="posts" loadPage={pageLoader()} storage={storage} />);
    expect(probe("posts").writes).toHaveLength(1);
  });

  test("waits for restored content that arrives later instead of jumping to top first", () => {
    const storage = createMemoryRestorationStorage();
    const restoredState = saveInfiniteScrollRestoration(storage, "posts", {
      pages: threePages,
      scrollOffset: 450,
    });

    const { rerender } = render(
      <ExternalPagesFeed
        feedKey="posts"
        pages={[]}
        restoredState={restoredState}
        storage={storage}
      />,
    );

    expect(probe("posts").writes).toEqual([]);
    expect(screen.getByTestId("posts").dataset.restoring).toBe("true");

    rerender(
      <ExternalPagesFeed
        feedKey="posts"
        pages={threePages.slice(0, 1)}
        restoredState={restoredState}
        storage={storage}
      />,
    );
    expect(probe("posts").writes).toEqual([]);

    rerender(
      <ExternalPagesFeed
        feedKey="posts"
        pages={threePages}
        restoredState={restoredState}
        storage={storage}
      />,
    );
    expect(probe("posts").writes).toEqual([{ itemsRendered: 9, value: 450 }]);
    expect(screen.getByTestId("posts").dataset.restoring).toBe("false");
  });

  // Review regression (implementation-authored): a snapshot read after mount, e.g. in an
  // effect to avoid hydration mismatches, must still be applied once.
  test("applies a restoration snapshot that arrives after mount", () => {
    const storage = createMemoryRestorationStorage();
    const restoredState = saveInfiniteScrollRestoration(storage, "posts", {
      pages: threePages,
      scrollOffset: 450,
    });

    const { rerender } = render(
      <ExternalPagesFeed feedKey="posts" pages={[]} restoredState={null} storage={storage} />,
    );
    expect(screen.getByTestId("posts").dataset.restoring).toBe("false");

    rerender(
      <ExternalPagesFeed
        feedKey="posts"
        pages={threePages}
        restoredState={restoredState}
        storage={storage}
      />,
    );
    expect(probe("posts").writes).toEqual([{ itemsRendered: 9, value: 450 }]);
    expect(screen.getByTestId("posts").dataset.restoring).toBe("false");
  });

  // Review regression (implementation-authored): an equivalent snapshot object passed again on
  // a later render must not re-apply the offset.
  test("does not re-apply the offset for a fresh but equivalent snapshot object", () => {
    const storage = createMemoryRestorationStorage();
    const restoredState = saveInfiniteScrollRestoration(storage, "posts", {
      pages: threePages,
      scrollOffset: 450,
    });

    const { rerender } = render(
      <ExternalPagesFeed
        feedKey="posts"
        pages={threePages}
        restoredState={restoredState}
        storage={storage}
      />,
    );
    rerender(
      <ExternalPagesFeed
        feedKey="posts"
        pages={threePages}
        restoredState={{ ...restoredState }}
        storage={storage}
      />,
    );
    expect(probe("posts").writes).toEqual([{ itemsRendered: 9, value: 450 }]);
  });

  // Review regression (implementation-authored): switching directly to another snapshot
  // without unmounting (e.g. a route parameter change) must restore the new one.
  test("applies a different snapshot supplied without unmounting", () => {
    const storage = createMemoryRestorationStorage();
    const first = saveInfiniteScrollRestoration(storage, "posts", {
      pages: threePages,
      scrollOffset: 450,
    });
    const second = saveInfiniteScrollRestoration(storage, "posts-other", {
      pages: threePages,
      scrollOffset: 150,
    });

    const { rerender } = render(
      <ExternalPagesFeed
        feedKey="posts"
        pages={threePages}
        restoredState={first}
        storage={storage}
      />,
    );
    rerender(
      <ExternalPagesFeed
        feedKey="posts"
        pages={threePages}
        restoredState={second}
        storage={storage}
      />,
    );
    expect(probe("posts").writes).toEqual([
      { itemsRendered: 9, value: 450 },
      { itemsRendered: 9, value: 150 },
    ]);
  });

  // Review regression (implementation-authored): a different snapshot with the same offset and
  // page count (other cursors) is still a new restoration.
  test("applies a different snapshot with the same offset and page count", () => {
    const storage = createMemoryRestorationStorage();
    const first = saveInfiniteScrollRestoration(storage, "posts", {
      pages: threePages,
      scrollOffset: 450,
    });
    const otherPages = [makePage(7, "cursor-7"), makePage(8, "cursor-8"), makePage(9, null)];
    const second = saveInfiniteScrollRestoration(storage, "posts-other", {
      pages: otherPages,
      scrollOffset: 450,
    });

    const { rerender } = render(
      <ExternalPagesFeed
        feedKey="posts"
        pages={threePages}
        restoredState={first}
        storage={storage}
      />,
    );
    act(() => probe("posts").userScroll(100));
    rerender(
      <ExternalPagesFeed
        feedKey="posts"
        pages={otherPages}
        restoredState={second}
        storage={storage}
      />,
    );
    expect(probe("posts").writes).toEqual([
      { itemsRendered: 9, value: 450 },
      { itemsRendered: 9, value: 450 },
    ]);
  });

  test("changed page counts: clamps the offset to the restored content instead of overshooting", () => {
    const storage = createMemoryRestorationStorage();
    saveInfiniteScrollRestoration(storage, "posts", {
      pages: threePages,
      scrollOffset: 800,
    });

    render(<Feed feedKey="posts" loadPage={pageLoader()} maxPages={2} storage={storage} />);

    // 2 pages × 3 items × 100px = 600px content, 300px viewport → max offset 300.
    expect(probe("posts").writes).toEqual([{ itemsRendered: 6, value: 300 }]);
  });

  test("missing state falls back to a normal first load and never touches the offset", () => {
    const storage = createMemoryRestorationStorage();
    const loadPage = pageLoader();

    render(<Feed feedKey="posts" loadPage={loadPage} storage={storage} />);

    expect(loadPage).toHaveBeenCalledTimes(1);
    expect(loadPage).toHaveBeenCalledWith(null);
    expect(probe("posts").writes).toEqual([]);
    expect(screen.getByTestId("posts").dataset.restoring).toBe("false");
  });

  test("changed content key starts fresh and the next save replaces the stale state", () => {
    const storage = createMemoryRestorationStorage();
    saveInfiniteScrollRestoration(storage, "posts", {
      contentKey: "v1",
      pages: threePages,
      scrollOffset: 450,
    });
    const loadPage = pageLoader();

    const { unmount } = render(
      <Feed contentKey="v2" feedKey="posts" loadPage={loadPage} storage={storage} />,
    );

    expect(loadPage).toHaveBeenCalledTimes(1);
    expect(loadPage).toHaveBeenCalledWith(null);
    expect(probe("posts").writes).toEqual([]);

    unmount();

    expect(readInfiniteScrollRestoration(storage, "posts", { contentKey: "v2" })).toMatchObject({
      contentKey: "v2",
      pages: [makePage(1, "cursor-1")],
    });
  });

  test("saves current pages and the last scroll offset on unmount", () => {
    const storage = createMemoryRestorationStorage();
    const loadPage = pageLoader();

    const { unmount } = render(<Feed feedKey="posts" loadPage={loadPage} storage={storage} />);
    intersect(observerRecords[observerRecords.length - 1]!);
    act(() => probe("posts").userScroll(120));

    unmount();

    expect(readInfiniteScrollRestoration<Post, string>(storage, "posts")).toMatchObject({
      pageParams: [null, "cursor-1"],
      pages: [makePage(1, "cursor-1"), makePage(2, "cursor-2")],
      scrollOffset: 120,
    });
  });

  test("save() persists on demand so apps can hook their own router events", () => {
    const storage = createMemoryRestorationStorage();

    render(<Feed contentKey="v1" feedKey="posts" loadPage={pageLoader()} storage={storage} />);
    act(() => probe("posts").userScroll(75));

    expect(readInfiniteScrollRestoration(storage, "posts")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "save posts" }));

    expect(readInfiniteScrollRestoration(storage, "posts")).toMatchObject({
      contentKey: "v1",
      pages: [makePage(1, "cursor-1")],
      scrollOffset: 75,
    });
  });

  test("multiple feeds with independent keys restore and save without interfering", () => {
    const storage = createMemoryRestorationStorage();
    saveInfiniteScrollRestoration(storage, "posts", {
      pages: threePages,
      scrollOffset: 450,
    });
    saveInfiniteScrollRestoration(storage, "comments", {
      pages: threePages.slice(0, 2),
      scrollOffset: 150,
    });
    const loadPosts = pageLoader();
    const loadComments = pageLoader();

    const { unmount } = render(
      <>
        <Feed feedKey="posts" loadPage={loadPosts} storage={storage} />
        <Feed feedKey="comments" loadPage={loadComments} storage={storage} />
      </>,
    );

    expect(loadPosts).not.toHaveBeenCalled();
    expect(loadComments).not.toHaveBeenCalled();
    expect(probe("posts").writes).toEqual([{ itemsRendered: 9, value: 450 }]);
    expect(probe("comments").writes).toEqual([{ itemsRendered: 6, value: 150 }]);

    act(() => probe("posts").userScroll(500));
    act(() => probe("comments").userScroll(20));
    unmount();

    expect(readInfiniteScrollRestoration(storage, "posts")?.scrollOffset).toBe(500);
    expect(readInfiniteScrollRestoration(storage, "comments")?.scrollOffset).toBe(20);
    expect(readInfiniteScrollRestoration(storage, "comments")?.pages).toHaveLength(2);
  });

  test("restoration is opt-in: enabled={false} neither restores nor writes", () => {
    const storage = createMemoryRestorationStorage();
    const saved = saveInfiniteScrollRestoration(storage, "posts", {
      pages: threePages,
      scrollOffset: 450,
    });
    const loadPage = pageLoader();

    const { unmount } = render(
      <Feed enabled={false} feedKey="posts" loadPage={loadPage} storage={storage} />,
    );

    expect(loadPage).toHaveBeenCalledTimes(1);
    expect(probe("posts").writes).toEqual([]);

    act(() => probe("posts").userScroll(30));
    unmount();

    expect(readInfiniteScrollRestoration(storage, "posts")).toEqual(saved);
  });
});

// --- Packaging --------------------------------------------------------------------------

describe("packaging", () => {
  test("adds no Next.js runtime dependency", () => {
    const packageDir = path.resolve(process.cwd(), "packages/infinite-scroll");
    const packageJson = JSON.parse(
      readFileSync(path.resolve(packageDir, "package.json"), "utf8"),
    ) as Record<string, Record<string, string> | undefined>;

    for (const field of [
      "dependencies",
      "peerDependencies",
      "optionalDependencies",
      "devDependencies",
    ]) {
      expect(Object.keys(packageJson[field] ?? {})).not.toContain("next");
    }

    const sourceDir = path.resolve(packageDir, "src");
    for (const file of readdirSync(sourceDir)) {
      if (!/\.tsx?$/.test(file) || /\.test\.tsx?$/.test(file)) {
        continue;
      }
      const source = readFileSync(path.join(sourceDir, file), "utf8");
      expect(source, file).not.toMatch(/from\s+["']next(\/|["'])/);
    }
  });
});
