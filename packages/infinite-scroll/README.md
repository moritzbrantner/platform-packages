# @moritzbrantner/infinite-scroll

Headless cursor helpers and React infinite-scroll behavior for reusable feeds, search results, timelines, and other incrementally loaded collections.

## Why this lives in platform-packages

The package owns loading behavior and pagination contracts, not visual design. Applications and `@moritzbrantner/ui` remain free to decide how lists, loaders, empty states, errors, and end-of-list messages look.

## Core cursor helpers

```ts
import { flattenCursorPages, type CursorPage } from "@moritzbrantner/infinite-scroll";

type Post = { id: string; title: string };

type PostsPage = CursorPage<Post, string>;

const posts = flattenCursorPages(pages);
```

`nextCursor: null` means the current page is terminal.

## React

The React entrypoint is a Client Component boundary and uses `IntersectionObserver` with a default `400px` bottom root margin so the next page can begin loading before the sentinel becomes visible.

```tsx
import { InfiniteScrollTrigger } from "@moritzbrantner/infinite-scroll/react";

export function PostFeed({ hasMore, isLoading, loadMore }: Props) {
  return (
    <>
      <PostList />
      <InfiniteScrollTrigger hasMore={hasMore} isLoading={isLoading} onLoadMore={loadMore}>
        {isLoading ? <LoadingMore /> : null}
      </InfiniteScrollTrigger>
    </>
  );
}
```

The component is deliberately unstyled and forwards normal `div` props. Use the `data-slot="infinite-scroll-trigger"`, `data-has-more`, and `data-loading` attributes when a consuming application needs styling or instrumentation.

For custom markup, use the hook directly:

```tsx
const { ref, loadMore } = useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
});
```

`loadMore` applies the same `enabled`, `hasMore`, and `isLoading` guards as the observer and can be attached to a manual "Load more" button as a keyboard-friendly fallback. After a call it also ignores further calls until the next render, so rapid observer callbacks cannot load the same page twice.

## Manual load-more fallback

`mode` selects how loading starts:

- `"automatic"` (default): the observer loads.
- `"manual"`: only the manual control loads. Nothing is observed, so it works without `IntersectionObserver`.
- `"automatic-with-fallback"`: the observer loads, and `showManualControl` turns true when `IntersectionObserver` is unavailable or `isError` is set.

Pass `isError` when the last page failed. Automatic loading then pauses so a failing request cannot retry in a loop, and the manual control retries through the same guarded path. The hook exposes `status` (`"idle" | "loading" | "error" | "exhausted" | "disabled"`) and `getLoadMoreProps()` for a native button. The package renders no button, loader, or error copy.

```tsx
const { ref, showManualControl, getLoadMoreProps, status } = useInfiniteScroll({
  hasMore: query.hasNextPage,
  isLoading: query.isFetchingNextPage,
  isError: query.isFetchNextPageError,
  mode: "automatic-with-fallback",
  onLoadMore: () => void query.fetchNextPage(),
});

return (
  <>
    <PostList />
    <div ref={ref} />
    {status === "error" ? <p role="alert">Couldn't load more posts.</p> : null}
    {showManualControl ? <Button {...getLoadMoreProps()}>Load more</Button> : null}
  </>
);
```

`getLoadMoreProps()` returns `type="button"`, `onClick`, `disabled` (while loading, disabled, or exhausted), `aria-busy`, and `data-state`. `showManualControl` is false once pagination is exhausted. Observer support is detected after mount, so server and client markup match, and the fallback button appears on the client when needed.

## Bidirectional scrolling

Chat history, logs, and feeds entered in the middle can load older pages above the content as well as newer pages below it. `CursorPage` accepts an optional `previousCursor` (`hasPreviousCursor(page)` checks it). Each direction has its own `hasMore`, `isLoading`, and guards, so loading one direction never triggers or blocks the other. Pass only `next` or only `previous` to scroll in a single direction.

```tsx
const { scrollRef, previousRef, nextRef } = useBidirectionalInfiniteScroll({
  previous: { hasMore: hasOlder, isLoading: isLoadingOlder, onLoad: loadOlder },
  next: { hasMore: hasNewer, isLoading: isLoadingNewer, onLoad: loadNewer },
});

return (
  <div ref={scrollRef} style={{ overflowY: "auto" }}>
    <div ref={previousRef} />
    <MessageList />
    <div ref={nextRef} />
  </div>
);
```

When a previous page is prepended, the hook keeps the scroll container's distance from the bottom before paint, so the content the user was looking at does not jump. The scroll container is also the observer root. `loadPrevious` and `loadNext` are returned for manual controls.

## TanStack Virtual

The package does not virtualize. For large feeds, render rows with TanStack Virtual (`@tanstack/react-virtual`) and keep the infinite-scroll sentinel outside the virtual window. Neither package depends on the other.

```tsx
"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useInfiniteScroll } from "@moritzbrantner/infinite-scroll/react";

export function VirtualPosts({ posts, hasMore, isLoading, loadMore }: Props) {
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: posts.length,
    estimateSize: () => 72,
    getItemKey: (index) => posts[index]!.id,
    getScrollElement: () => scrollElement,
    overscan: 5,
  });
  const { ref } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: loadMore,
    root: scrollElement,
  });

  return (
    <div ref={setScrollElement} style={{ height: 600, overflowY: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((row) => (
          <div
            key={row.key}
            ref={virtualizer.measureElement}
            data-index={row.index}
            style={{
              position: "absolute",
              top: 0,
              width: "100%",
              transform: `translateY(${row.start}px)`,
            }}
          >
            <Post post={posts[row.index]!} />
          </div>
        ))}
      </div>
      <div ref={ref} />
    </div>
  );
}
```

- **Where the trigger lives.** Put the sentinel after the element sized by `getTotalSize()`, inside the scroll container, and pass that container as `root`. The sentinel is always mounted at the end of the full list height, so it does not depend on which rows are in the virtual window. Don't make the sentinel a virtual row: it would mount and unmount with the window.
- **Overscan and root margin.** `overscan` only changes which rows render, not the sentinel position, so it cannot trigger fetches. `rootMargin` (default `400px` below the viewport) decides how early the next page starts. Each loading cycle fetches one page. While `isLoading` is true the observer is disconnected. When it re-arms after the page renders, the sentinel has moved down by the new page's height, so it fetches again only if the content still doesn't reach the margin.
- **Variable heights.** Use `measureElement` with `data-index` and position rows with `start`, as above. `estimateSize` should be close to the typical row height: until rows are measured, `getTotalSize()` and therefore the sentinel position are based on estimates.
- **Scroll restoration.** `useInfiniteScrollRestoration` and the virtualizer can share the scroll container. Attach the restoration `scrollRef` and the virtualizer's scroll element to the same node with one callback ref. The virtualizer follows the offset the hook applies. Restore with the same `estimateSize`, or pass the saved offset as `initialOffset`, so the restored position lands on the same rows.
- **Prepending pages.** `useBidirectionalInfiniteScroll` keeps the distance from the bottom when a previous page is prepended, measured with the estimated sizes of the new rows. Use `getItemKey` with stable item keys so measured rows keep their sizes after the indexes shift. Rows that measure differently from their estimate shift the anchor by the difference.

## TanStack Query

The optional `@moritzbrantner/infinite-scroll/tanstack-query` entrypoint maps a `useInfiniteQuery` result onto the hook and trigger options. It has no runtime dependency on TanStack Query, and the root, `/core`, and `/react` entrypoints never import it.

```tsx
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useInfiniteScroll } from "@moritzbrantner/infinite-scroll/react";
import { infiniteQueryScrollOptions } from "@moritzbrantner/infinite-scroll/tanstack-query";

export function Posts() {
  const query = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
  const { ref } = useInfiniteScroll(infiniteQueryScrollOptions(query));

  return (
    <>
      {query.data?.pages
        .flatMap((page) => page.items)
        .map((post) => (
          <Post key={post.id} post={post} />
        ))}
      <div ref={ref} />
    </>
  );
}
```

`infiniteQueryScrollOptions(query)` returns `{ hasMore, isLoading, isError, onLoadMore }`, so it also spreads into `<InfiniteScrollTrigger {...infiniteQueryScrollOptions(query)} />` and composes with `mode: "automatic-with-fallback"`.

- `hasMore` is `hasNextPage`, and `isError` is `isFetchNextPageError`. A failed page pauses automatic loading. The error itself stays on the query for the app to render and retry.
- `isLoading` is `isFetching`, not just `isFetchingNextPage`. TanStack Query fetches one page at a time per query, so starting a page fetch during a background refetch would overwrite fresh data.
- `onLoadMore` calls `fetchNextPage({ cancelRefetch: false })`. A repeated observer notification joins the in-flight fetch instead of cancelling and restarting it.

For queries with `getPreviousPageParam`, `infiniteQueryScrollDirections(query)` returns `{ next, previous }` for `useBidirectionalInfiniteScroll`. Both directions wait while either is fetching, because they share one query.

## Scroll restoration

Restoration is opt-in and storage-agnostic. It keeps both the loaded pages and the exact viewport offset when users navigate away and back. The package never owns routing or an application cache.

- `readInfiniteScrollRestoration(storage, key, { contentKey?, maxPages? })` returns the saved `{ version, pages, pageParams, scrollOffset, contentKey? }` or `null`. It returns `null` when the state is missing, malformed or saved for another `contentKey`, so the feed does a normal first load.
- Seed the feed's pages from that state. Restored pages are rendered as-is and never refetched just to rebuild the scroll position. `pageParams` maps onto TanStack Query's `initialData`. Set a `staleTime` that covers restored visits (optionally with `initialDataUpdatedAt`), or `refetchOnMount: false`, so TanStack doesn't treat restored data as stale and refetch it on mount, replacing pages while the offset is being restored.
- `useInfiniteScrollRestoration({ key, storage, restoredState, pages, contentKey?, enabled? })` applies the saved offset exactly once, in the first commit where the restored pages are rendered. This avoids a jump to the top followed by a jump back. If the content is now shorter, the offset is clamped to the maximum scroll position. The hook saves the latest pages and offset on unmount, or when you call `save()`.
- Storage adapters: `createMemoryRestorationStorage()` or `createWebStorageRestorationStorage(sessionStorage)`. You can also implement `{ get, set, remove }` on top of URL or router state. Use a different `key` for each feed instance.
- `maxPages` limits how many saved pages come back, and `contentKey` discards state that belongs to different content.

```tsx
"use client";

import {
  createWebStorageRestorationStorage,
  readInfiniteScrollRestoration,
} from "@moritzbrantner/infinite-scroll";
import {
  InfiniteScrollTrigger,
  useInfiniteScrollRestoration,
} from "@moritzbrantner/infinite-scroll/react";

export function RestorableFeed({ firstPage, feedKey }: Props) {
  const storage = useMemo(() => createWebStorageRestorationStorage(sessionStorage), []);
  const [restoredState] = useState(() => readInfiniteScrollRestoration<Post>(storage, feedKey));
  const [pages, setPages] = useState(() => restoredState?.pages ?? [firstPage]);
  const { scrollRef, isRestoring } = useInfiniteScrollRestoration({
    key: feedKey,
    storage,
    restoredState,
    pages,
  });

  return (
    <div ref={scrollRef} style={{ overflowY: "auto" }}>
      <PostList pages={pages} />
      <InfiniteScrollTrigger enabled={!isRestoring} hasMore={…} onLoadMore={…} />
    </div>
  );
}
```

In the Next.js App Router, keep the first page server-rendered and pass it to a client boundary like the one above. `sessionStorage` exists only in the browser, so read it where the client boundary mounts without server HTML for that state. One way is to render the boundary with `next/dynamic` and `ssr: false`. Another is to read restoration state in an effect and show the server-rendered first page until then. Pass the feed's scroll container to `scrollRef`. Window scrolling is not managed.

## Next.js App Router

No Next.js-specific runtime package is needed. Fetch the first page in a Server Component when useful, then pass serializable initial data into a small Client Component that owns the infinite query and trigger.

This keeps server fetching, caching, authentication, and route concerns in the application while `@moritzbrantner/infinite-scroll/react` owns only the browser observer behavior.

## Accessibility and UX

Infinite scrolling should not be the only way to reach important content or actions. For long feeds, consider a visible manual load-more control, a meaningful end state, stable focus behavior, and a separate route or pagination mode when users need deterministic navigation or to reach a footer reliably.
