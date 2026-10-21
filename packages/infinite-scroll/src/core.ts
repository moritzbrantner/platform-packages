export type CursorPage<TItem, TCursor = string> = {
  items: readonly TItem[];
  nextCursor: TCursor | null;
  /** Cursor for the page before this one; omit or `null` when nothing precedes it. */
  previousCursor?: TCursor | null;
};

function flattenCursorPages<TItem>(pages: readonly CursorPage<TItem, unknown>[]): TItem[] {
  return pages.flatMap((page) => page.items);
}

function hasNextCursor<TCursor>(page: Pick<CursorPage<unknown, TCursor>, "nextCursor">): boolean {
  return page.nextCursor !== null;
}

function hasPreviousCursor<TCursor>(
  page: Pick<CursorPage<unknown, TCursor>, "previousCursor">,
): boolean {
  return page.previousCursor !== null && page.previousCursor !== undefined;
}

export { flattenCursorPages, hasNextCursor, hasPreviousCursor };

export * from "./restoration";
