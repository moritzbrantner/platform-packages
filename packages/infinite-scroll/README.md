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

`loadMore` applies the same `enabled`, `hasMore`, and `isLoading` guards as the observer and can be attached to a manual "Load more" button as a keyboard-friendly fallback.

## TanStack Query

The package does not depend on TanStack Query. Its state shape maps directly onto `useInfiniteQuery`:

```tsx
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { InfiniteScrollTrigger } from "@moritzbrantner/infinite-scroll/react";

export function Posts() {
  const query = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  return (
    <>
      {query.data?.pages
        .flatMap((page) => page.items)
        .map((post) => (
          <Post key={post.id} post={post} />
        ))}

      <InfiniteScrollTrigger
        hasMore={query.hasNextPage}
        isLoading={query.isFetchingNextPage}
        onLoadMore={() => {
          void query.fetchNextPage();
        }}
      />
    </>
  );
}
```

## Scroll restoration

Restoration is opt-in and storage-agnostic. It keeps both the loaded pages and the exact viewport offset when users navigate away and back. The package never owns routing or an application cache.

- `readInfiniteScrollRestoration(storage, key, { contentKey?, maxPages? })` returns the saved `{ version, pages, pageParams, scrollOffset, contentKey? }` or `null`. It returns `null` when the state is missing, malformed or saved for another `contentKey`, so the feed does a normal first load.
- Seed the feed's pages from that state. Restored pages are rendered as-is and never refetched just to rebuild the scroll position. `pageParams` maps onto TanStack Query's `initialData`.
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
