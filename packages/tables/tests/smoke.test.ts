import { describe, expect, test } from "vitest";

import { createTableDensityIndex, type TableDensityColumn } from "@moritzbrantner/tables";

describe("@moritzbrantner/tables", () => {
  test("creates virtualized table windows with metric summaries", () => {
    const index = createTableDensityIndex(
      Array.from({ length: 20 }, (_, rowIndex) => ({
        id: `row-${rowIndex}`,
        metrics: { revenue: rowIndex * 10 },
        status: rowIndex % 2 === 0 ? "open" : "closed",
      })),
      {
        filterItem(row) {
          return row.status === "open";
        },
      },
    );

    const window = index.getRowWindow({ limit: 4, offset: 3, overscan: 1 });

    expect(window.rows.map((row) => row.id)).toEqual([
      "row-4",
      "row-6",
      "row-8",
      "row-10",
      "row-12",
      "row-14",
    ]);
    expect(window.summary.filteredItemCount).toBe(10);
    expect(window.summary.visibleItemCount).toBe(6);
    expect(window.summary.metrics.revenue).toBe(540);
    expect(index.getRowById("row-6")?.item.status).toBe("open");
  });

  test("keeps lightweight column descriptors close to rows", () => {
    const columns: Array<TableDensityColumn<{ total: number }>> = [
      {
        accessor: (row) => row.total,
        header: "Total",
        id: "total",
      },
    ];

    expect(columns[0]?.accessor({ total: 42 }, 0)).toBe(42);
  });
});
