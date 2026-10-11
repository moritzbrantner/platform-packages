import type { CursorPage } from "./core";

/** Serializable snapshot of an infinite feed: its loaded pages plus the viewport offset. */
export type InfiniteScrollRestorationState<TItem, TCursor = string> = {
  version: 1;
  /** Already-loaded pages, restored as-is so they are not refetched. */
  pages: readonly CursorPage<TItem, TCursor>[];
  /** Cursor used to load each page (TanStack Query `pageParams`). */
  pageParams: readonly (TCursor | null)[];
  /** Pixels from the top of the scroll container. */
  scrollOffset: number;
  /** App-defined fingerprint of the content/version the pages belong to. */
  contentKey?: string;
};

/** Where restoration state lives: memory, session storage, URL or router state, an app cache… */
export interface InfiniteScrollRestorationStorage {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  remove(key: string): void;
}

export type SaveInfiniteScrollRestorationInput<TItem, TCursor = string> = {
  pages: readonly CursorPage<TItem, TCursor>[];
  scrollOffset: number;
  pageParams?: readonly (TCursor | null)[];
  contentKey?: string;
};

export type ReadInfiniteScrollRestorationOptions = {
  /** Discard saved state whose `contentKey` differs (or is missing). */
  contentKey?: string;
  /** Restore at most the first N saved pages. */
  maxPages?: number;
};

const WEB_STORAGE_PREFIX = "infinite-scroll-restoration:";

function createMemoryRestorationStorage(): InfiniteScrollRestorationStorage {
  const entries = new Map<string, unknown>();

  return {
    get: (key) => entries.get(key),
    remove: (key) => {
      entries.delete(key);
    },
    set: (key, value) => {
      entries.set(key, value);
    },
  };
}

function createWebStorageRestorationStorage(
  storage: Pick<Storage, "getItem" | "removeItem" | "setItem">,
): InfiniteScrollRestorationStorage {
  return {
    get: (key) => {
      const raw = storage.getItem(WEB_STORAGE_PREFIX + key);
      if (raw === null) {
        return undefined;
      }

      try {
        return JSON.parse(raw) as unknown;
      } catch {
        return undefined;
      }
    },
    remove: (key) => storage.removeItem(WEB_STORAGE_PREFIX + key),
    set: (key, value) => storage.setItem(WEB_STORAGE_PREFIX + key, JSON.stringify(value)),
  };
}

function derivePageParams<TCursor>(
  pages: readonly CursorPage<unknown, TCursor>[],
): (TCursor | null)[] {
  return pages.map((_, index) => (index === 0 ? null : pages[index - 1]!.nextCursor));
}

function saveInfiniteScrollRestoration<TItem, TCursor = string>(
  storage: InfiniteScrollRestorationStorage,
  key: string,
  {
    contentKey,
    pageParams,
    pages,
    scrollOffset,
  }: SaveInfiniteScrollRestorationInput<TItem, TCursor>,
): InfiniteScrollRestorationState<TItem, TCursor> {
  const state: InfiniteScrollRestorationState<TItem, TCursor> = {
    pageParams: pageParams ? [...pageParams] : derivePageParams(pages),
    pages: [...pages],
    scrollOffset,
    version: 1,
    ...(contentKey === undefined ? {} : { contentKey }),
  };

  storage.set(key, state);
  return state;
}

function isRestorationState(
  value: unknown,
): value is InfiniteScrollRestorationState<unknown, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<InfiniteScrollRestorationState<unknown, unknown>>;
  return (
    state.version === 1 &&
    Array.isArray(state.pages) &&
    state.pages.length > 0 &&
    state.pages.every(
      (page) =>
        typeof page === "object" &&
        page !== null &&
        Array.isArray(page.items) &&
        "nextCursor" in page &&
        page.nextCursor !== undefined,
    ) &&
    Array.isArray(state.pageParams) &&
    state.pageParams.length === state.pages.length &&
    typeof state.scrollOffset === "number" &&
    Number.isFinite(state.scrollOffset) &&
    state.scrollOffset >= 0 &&
    (state.contentKey === undefined || typeof state.contentKey === "string")
  );
}

/** Returns the saved state, or `null` when it is missing, malformed or belongs to other content. */
function readInfiniteScrollRestoration<TItem, TCursor = string>(
  storage: InfiniteScrollRestorationStorage,
  key: string,
  { contentKey, maxPages }: ReadInfiniteScrollRestorationOptions = {},
): InfiniteScrollRestorationState<TItem, TCursor> | null {
  const value = storage.get(key);
  if (!isRestorationState(value)) {
    return null;
  }

  if (contentKey !== undefined && value.contentKey !== contentKey) {
    return null;
  }

  const state = value as InfiniteScrollRestorationState<TItem, TCursor>;
  if (maxPages === undefined || state.pages.length <= maxPages) {
    return state;
  }

  const count = Math.max(1, Math.floor(maxPages));
  return {
    ...state,
    pageParams: state.pageParams.slice(0, count),
    pages: state.pages.slice(0, count),
  };
}

function clearInfiniteScrollRestoration(storage: InfiniteScrollRestorationStorage, key: string) {
  storage.remove(key);
}

export {
  clearInfiniteScrollRestoration,
  createMemoryRestorationStorage,
  createWebStorageRestorationStorage,
  readInfiniteScrollRestoration,
  saveInfiniteScrollRestoration,
};
