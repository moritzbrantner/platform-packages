export type CursorPage<TItem, TCursor = string> = {
  items: readonly TItem[];
  nextCursor: TCursor | null;
};

function flattenCursorPages<TItem>(pages: readonly CursorPage<TItem, unknown>[]): TItem[] {
  return pages.flatMap((page) => page.items);
}

function hasNextCursor<TCursor>(page: Pick<CursorPage<unknown, TCursor>, "nextCursor">): boolean {
  return page.nextCursor !== null;
}

export { flattenCursorPages, hasNextCursor };
