import {
  createDataDensityWindowIndex,
  type DataDensityItemWindowQuery,
  type DataDensityMetricRecord,
  type DataDensityWindow,
  type DataDensityWindowIndexOptions,
  type DataDensityWindowSummary,
  type IndexedDataDensityItem,
} from "@moritzbrantner/data-density";

export type TableMetricRecord = DataDensityMetricRecord;
export type TableDensityRowWindowQuery = DataDensityItemWindowQuery;
export type IndexedTableDensityRow<TRow> = IndexedDataDensityItem<TRow>;

export type TableDensityColumn<TRow> = {
  accessor: (row: TRow, rowIndex: number) => unknown;
  header?: string;
  id: string;
};

export type TableDensityRowWindow<TRow> = {
  rows: Array<IndexedTableDensityRow<TRow>>;
  summary: DataDensityWindowSummary;
};

export type TableDensityIndex<TRow> = {
  getRowById(rowId: string): IndexedTableDensityRow<TRow> | null;
  getRowWindow(query: TableDensityRowWindowQuery): TableDensityRowWindow<TRow>;
  getWindow(query: TableDensityRowWindowQuery): DataDensityWindow<TRow>;
};

export type TableDensityIndexOptions<TRow> = DataDensityWindowIndexOptions<TRow>;

export function createTableDensityIndex<TRow>(
  rows: readonly TRow[],
  options: TableDensityIndexOptions<TRow> = {},
): TableDensityIndex<TRow> {
  const windowIndex = createDataDensityWindowIndex(rows, options);

  return {
    getRowById(rowId) {
      return windowIndex.getItemById(rowId);
    },

    getRowWindow(query) {
      const window = windowIndex.getWindow(query);

      return {
        rows: window.items,
        summary: window.summary,
      };
    },

    getWindow(query) {
      return windowIndex.getWindow(query);
    },
  };
}

export const createTableWindowIndex = createTableDensityIndex;
