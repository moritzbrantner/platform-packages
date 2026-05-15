"use client";

import * as React from "react";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type OnChangeFn,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Table as ReactTable,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  EyeIcon,
  FilterIcon,
} from "lucide-react";

import { cn } from "../lib/cn";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./context-menu";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Input } from "./input";
import { Label } from "./label";
import { SelectDropdown } from "./select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

type DataGridDensity = "compact" | "comfortable" | "spacious";
type DataGridStatus = "idle" | "loading" | "error" | "empty";
type DataGridColumnFilterKind = "text" | "number" | "date" | "boolean";

type DataGridColumnFilterMeta = {
  dataGridFilter?: DataGridColumnFilterKind | false;
};

type DataGridTextFilterValue = {
  kind: "text";
  value?: string;
  values?: string[];
};

type DataGridNumberFilterValue = {
  kind: "number";
  min?: string;
  max?: string;
};

type DataGridDateFilterValue = {
  kind: "date";
  from?: string;
  to?: string;
};

type DataGridBooleanFilterValue = {
  kind: "boolean";
  value?: "true" | "false";
};

type DataGridColumnFilterValue =
  | string
  | DataGridTextFilterValue
  | DataGridNumberFilterValue
  | DataGridDateFilterValue
  | DataGridBooleanFilterValue;

type DataGridControlledState = {
  sorting?: SortingState;
  columnFilters?: ColumnFiltersState;
  columnVisibility?: VisibilityState;
  rowSelection?: RowSelectionState;
  globalFilter?: string;
  pagination?: PaginationState;
};

type DataGridServerProps = {
  state?: DataGridControlledState;
  onSortingChange?: OnChangeFn<SortingState>;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  onGlobalFilterChange?: OnChangeFn<string>;
  onPaginationChange?: OnChangeFn<PaginationState>;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  manualPagination?: boolean;
  pageCount?: number;
  rowCount?: number;
};

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> extends DataGridColumnFilterMeta {}
}

type DataGridProps<TData, TValue = unknown> = Omit<React.ComponentProps<"div">, "children"> & {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  getRowId?: (originalRow: TData, index: number, parent?: { id: string }) => string;
  enableRowSelection?: boolean;
  pageSize?: number;
  searchPlaceholder?: string;
  emptyMessage?: React.ReactNode;
  loadingMessage?: React.ReactNode;
  error?: React.ReactNode;
  loading?: boolean;
  density?: DataGridDensity;
  onDensityChange?: (density: DataGridDensity) => void;
  onSelectedRowsChange?: (rows: TData[]) => void;
  toolbar?: React.ReactNode | ((table: ReactTable<TData>) => React.ReactNode);
} & DataGridServerProps;

type DataGridToolbarProps<TData> = React.ComponentProps<"div"> & {
  table?: ReactTable<TData>;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
};

type DataGridPaginationProps<TData> = React.ComponentProps<"div"> & {
  table: ReactTable<TData>;
};

type DataGridColumnHeaderProps<TData, TValue> = React.ComponentProps<"button"> & {
  column: Column<TData, TValue>;
  title: React.ReactNode;
};

type DataGridViewOptionsProps<TData> = React.ComponentProps<typeof Button> & {
  table: ReactTable<TData>;
};

type DataGridColumnFilterContextProps<TData, TValue> = {
  column: Column<TData, TValue>;
  children: React.ReactElement;
};

type DataGridColumnFilterMenuProps<TData, TValue> = {
  column: Column<TData, TValue>;
  filterKind: DataGridColumnFilterKind;
};

const densityClasses: Record<DataGridDensity, string> = {
  compact: "[&_td]:py-1.5 [&_th]:h-8",
  comfortable: "[&_td]:py-2 [&_th]:h-10",
  spacious: "[&_td]:py-3 [&_th]:h-12",
};

const dataGridFilterFn: FilterFn<RowData> = (row, columnId, filterValue) => {
  if (isEmptyColumnFilterValue(filterValue)) {
    return true;
  }

  const cellValue = row.getValue(columnId);

  if (isDataGridNumberFilterValue(filterValue)) {
    const numericValue = coerceNumber(cellValue);
    const min = coerceNumber(filterValue.min);
    const max = coerceNumber(filterValue.max);

    if (numericValue === undefined) {
      return false;
    }

    return (min === undefined || numericValue >= min) && (max === undefined || numericValue <= max);
  }

  if (isDataGridDateFilterValue(filterValue)) {
    const timestamp = coerceDateTimestamp(cellValue);
    const from = coerceDateTimestamp(filterValue.from);
    const to = coerceDateTimestamp(filterValue.to, true);

    if (timestamp === undefined) {
      return false;
    }

    return (from === undefined || timestamp >= from) && (to === undefined || timestamp <= to);
  }

  if (isDataGridBooleanFilterValue(filterValue)) {
    const booleanValue = coerceBoolean(cellValue);

    return booleanValue !== undefined && String(booleanValue) === filterValue.value;
  }

  if (isDataGridTextFilterValue(filterValue)) {
    const normalizedValue = normalizeFilterText(cellValue);
    const textMatch = filterValue.value
      ? normalizedValue.includes(normalizeFilterText(filterValue.value))
      : true;
    const valueMatch = filterValue.values?.length
      ? filterValue.values.includes(String(cellValue))
      : true;

    return textMatch && valueMatch;
  }

  return normalizeFilterText(cellValue).includes(normalizeFilterText(filterValue));
};

dataGridFilterFn.autoRemove = isEmptyColumnFilterValue;

function DataGrid<TData, TValue = unknown>({
  columns,
  data,
  getRowId,
  enableRowSelection = false,
  pageSize = 10,
  searchPlaceholder = "Search rows...",
  emptyMessage = "No results.",
  loadingMessage = "Loading rows...",
  error,
  loading = false,
  density = "comfortable",
  onSelectedRowsChange,
  toolbar,
  state: controlledState,
  onSortingChange,
  onColumnFiltersChange,
  onColumnVisibilityChange,
  onRowSelectionChange,
  onGlobalFilterChange,
  onPaginationChange,
  manualSorting,
  manualFiltering,
  manualPagination,
  pageCount,
  rowCount,
  className,
  ...props
}: DataGridProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  React.useEffect(() => {
    if (controlledState?.pagination === undefined) {
      setPagination((current) => ({ ...current, pageSize }));
    }
  }, [controlledState?.pagination, pageSize]);

  const resolvedSorting = controlledState?.sorting ?? sorting;
  const resolvedColumnFilters = controlledState?.columnFilters ?? columnFilters;
  const resolvedColumnVisibility = controlledState?.columnVisibility ?? columnVisibility;
  const resolvedRowSelection = controlledState?.rowSelection ?? rowSelection;
  const resolvedGlobalFilter = controlledState?.globalFilter ?? globalFilter;
  const resolvedPagination = controlledState?.pagination ?? pagination;

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    if (controlledState?.sorting === undefined) {
      setSorting(updater);
    }
    onSortingChange?.(updater);
  };

  const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    if (controlledState?.columnFilters === undefined) {
      setColumnFilters(updater);
    }
    onColumnFiltersChange?.(updater);
  };

  const handleColumnVisibilityChange: OnChangeFn<VisibilityState> = (updater) => {
    if (controlledState?.columnVisibility === undefined) {
      setColumnVisibility(updater);
    }
    onColumnVisibilityChange?.(updater);
  };

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    if (controlledState?.rowSelection === undefined) {
      setRowSelection(updater);
    }
    onRowSelectionChange?.(updater);
  };

  const handleGlobalFilterChange: OnChangeFn<string> = (updater) => {
    if (controlledState?.globalFilter === undefined) {
      setGlobalFilter(updater);
    }
    onGlobalFilterChange?.(updater);
  };

  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    if (controlledState?.pagination === undefined) {
      setPagination(updater);
    }
    onPaginationChange?.(updater);
  };

  const tableColumns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    if (!enableRowSelection) {
      return columns as ColumnDef<TData, unknown>[];
    }

    return [
      {
        id: "__select",
        enableHiding: false,
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all rows"
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label="Select row"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
          />
        ),
      },
      ...(columns as ColumnDef<TData, unknown>[]),
    ];
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getRowId,
    state: {
      sorting: resolvedSorting,
      columnFilters: resolvedColumnFilters,
      columnVisibility: resolvedColumnVisibility,
      rowSelection: resolvedRowSelection,
      globalFilter: resolvedGlobalFilter,
      pagination: resolvedPagination,
    },
    enableRowSelection,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onRowSelectionChange: handleRowSelectionChange,
    onGlobalFilterChange: handleGlobalFilterChange,
    onPaginationChange: handlePaginationChange,
    manualSorting,
    manualFiltering,
    manualPagination,
    pageCount,
    rowCount,
    defaultColumn: {
      filterFn: dataGridFilterFn as FilterFn<TData>,
    },
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
  });

  React.useEffect(() => {
    onSelectedRowsChange?.(table.getSelectedRowModel().rows.map((row) => row.original));
  }, [onSelectedRowsChange, resolvedRowSelection, table]);

  const visibleColumnCount = Math.max(table.getVisibleLeafColumns().length, 1);
  const status: DataGridStatus = loading
    ? "loading"
    : error
      ? "error"
      : table.getRowModel().rows.length === 0
        ? "empty"
        : "idle";

  return (
    <div
      data-slot="data-grid"
      data-density={density}
      data-status={status}
      className={cn("space-y-4", className)}
      {...props}
    >
      {toolbar === undefined ? (
        <DataGridToolbar
          table={table}
          searchValue={resolvedGlobalFilter}
          onSearchChange={(value) => handleGlobalFilterChange(value)}
          searchPlaceholder={searchPlaceholder}
        />
      ) : typeof toolbar === "function" ? (
        toolbar(table)
      ) : (
        toolbar
      )}
      <div className={cn("overflow-hidden rounded-md border", densityClasses[density])}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    data-filtered={header.column.getIsFiltered() ? "true" : undefined}
                    className="data-[filtered=true]:bg-accent/40"
                  >
                    {header.isPlaceholder ? null : (
                      <DataGridColumnFilterContext column={header.column}>
                        <div
                          data-slot="data-grid-column-filter-trigger"
                          className="-mx-2 flex min-h-full items-center px-2"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </div>
                      </DataGridColumnFilterContext>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {status === "loading" || status === "error" || status === "empty" ? (
              <TableRow>
                <TableCell colSpan={visibleColumnCount} className="h-24 text-center">
                  <div
                    role={status === "loading" ? "status" : undefined}
                    className="text-sm text-muted-foreground"
                  >
                    {status === "loading" ? loadingMessage : status === "error" ? error : emptyMessage}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <DataGridPagination table={table} />
    </div>
  );
}

function DataGridToolbar<TData>({
  table,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search rows...",
  children,
  className,
  ...props
}: DataGridToolbarProps<TData>) {
  return (
    <div
      data-slot="data-grid-toolbar"
      className={cn("flex flex-wrap items-center justify-between gap-2", className)}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {onSearchChange ? (
          <Input
            aria-label="Search rows"
            value={searchValue ?? ""}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="max-w-sm"
          />
        ) : null}
        {children}
      </div>
      {table ? <DataGridViewOptions table={table} /> : null}
    </div>
  );
}

function DataGridPagination<TData>({ table, className, ...props }: DataGridPaginationProps<TData>) {
  return (
    <div
      data-slot="data-grid-pagination"
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
      {...props}
    >
      <p className="text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length}{" "}
        row(s) selected
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function DataGridColumnHeader<TData, TValue>({
  column,
  title,
  className,
  ...props
}: DataGridColumnHeaderProps<TData, TValue>) {
  const sorted = column.getIsSorted();
  const filtered = column.getIsFiltered();

  if (!column.getCanSort()) {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <span>{title}</span>
        {filtered ? <FilterIcon aria-hidden="true" className="size-3.5 text-muted-foreground" /> : null}
      </span>
    );
  }

  return (
    <button
      type="button"
      data-slot="data-grid-column-header"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md text-left font-medium outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
      onClick={() => column.toggleSorting(sorted === "asc")}
      {...props}
    >
      <span>{title}</span>
      {filtered ? <FilterIcon aria-hidden="true" className="size-3.5 text-muted-foreground" /> : null}
      {sorted === "asc" ? (
        <ArrowUpIcon aria-hidden="true" className="size-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDownIcon aria-hidden="true" className="size-3.5" />
      ) : (
        <ArrowUpDownIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

function DataGridColumnFilterContext<TData, TValue>({
  column,
  children,
}: DataGridColumnFilterContextProps<TData, TValue>) {
  const filterKind = getColumnFilterKind(column);

  if (!filterKind) {
    return children;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <DataGridColumnFilterMenu column={column} filterKind={filterKind} />
      </ContextMenuContent>
    </ContextMenu>
  );
}

function DataGridColumnFilterMenu<TData, TValue>({
  column,
  filterKind,
}: DataGridColumnFilterMenuProps<TData, TValue>) {
  const label = getColumnFilterLabel(column);
  const filterValue = column.getFilterValue();

  return (
    <div data-slot="data-grid-column-filter-menu" className="space-y-2 p-1">
      <ContextMenuLabel className="flex items-center gap-1.5 px-0">
        <FilterIcon aria-hidden="true" className="size-3.5" />
        Filter {label}
      </ContextMenuLabel>
      <ContextMenuSeparator />
      {filterKind === "number" ? (
        <DataGridNumberFilter column={column} filterValue={filterValue} label={label} />
      ) : filterKind === "date" ? (
        <DataGridDateFilter column={column} filterValue={filterValue} label={label} />
      ) : filterKind === "boolean" ? (
        <DataGridBooleanFilter column={column} filterValue={filterValue} label={label} />
      ) : (
        <DataGridTextFilter column={column} filterValue={filterValue} label={label} />
      )}
      <div className="pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          disabled={!column.getIsFiltered()}
          onClick={() => column.setFilterValue(undefined)}
        >
          Clear filter
        </Button>
      </div>
    </div>
  );
}

function DataGridTextFilter<TData, TValue>({
  column,
  filterValue,
  label,
}: {
  column: Column<TData, TValue>;
  filterValue: unknown;
  label: string;
}) {
  const textFilter = getTextFilterValue(filterValue);
  const options = getTextFilterOptions(column);

  return (
    <div className="space-y-2">
      <Label className="grid gap-1 text-xs text-muted-foreground">
        Contains
        <Input
          aria-label={`Filter ${label}`}
          value={textFilter.value ?? ""}
          placeholder="Contains..."
          onChange={(event) =>
            column.setFilterValue(cleanColumnFilterValue({
              ...textFilter,
              kind: "text",
              value: event.target.value,
            }))
          }
        />
      </Label>
      {options.length ? (
        <div className="space-y-1">
          <p className="px-0 text-xs font-medium text-muted-foreground">Values</p>
          <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
            {options.map((option) => {
              const checked = textFilter.values?.includes(option.value) ?? false;

              return (
                <Label
                  key={option.value}
                  className="flex min-h-7 items-center gap-2 rounded-md px-1.5 text-sm font-normal hover:bg-accent"
                >
                  <Checkbox
                    aria-label={`Filter ${label} by ${option.label}`}
                    checked={checked}
                    onCheckedChange={(value) => {
                      const currentValues = textFilter.values ?? [];
                      const nextValues = value
                        ? [...currentValues, option.value]
                        : currentValues.filter((currentValue) => currentValue !== option.value);

                      column.setFilterValue(cleanColumnFilterValue({
                        ...textFilter,
                        kind: "text",
                        values: nextValues,
                      }));
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.count}</span>
                </Label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DataGridNumberFilter<TData, TValue>({
  column,
  filterValue,
  label,
}: {
  column: Column<TData, TValue>;
  filterValue: unknown;
  label: string;
}) {
  const numberFilter = isDataGridNumberFilterValue(filterValue)
    ? filterValue
    : { kind: "number" as const };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Label className="grid gap-1 text-xs text-muted-foreground">
        Min
        <Input
          aria-label={`Minimum ${label}`}
          type="number"
          value={numberFilter.min ?? ""}
          onChange={(event) =>
            column.setFilterValue(cleanColumnFilterValue({
              ...numberFilter,
              kind: "number",
              min: event.target.value,
            }))
          }
        />
      </Label>
      <Label className="grid gap-1 text-xs text-muted-foreground">
        Max
        <Input
          aria-label={`Maximum ${label}`}
          type="number"
          value={numberFilter.max ?? ""}
          onChange={(event) =>
            column.setFilterValue(cleanColumnFilterValue({
              ...numberFilter,
              kind: "number",
              max: event.target.value,
            }))
          }
        />
      </Label>
    </div>
  );
}

function DataGridDateFilter<TData, TValue>({
  column,
  filterValue,
  label,
}: {
  column: Column<TData, TValue>;
  filterValue: unknown;
  label: string;
}) {
  const dateFilter = isDataGridDateFilterValue(filterValue) ? filterValue : { kind: "date" as const };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Label className="grid gap-1 text-xs text-muted-foreground">
        From
        <Input
          aria-label={`From ${label}`}
          type="date"
          value={dateFilter.from ?? ""}
          onChange={(event) =>
            column.setFilterValue(cleanColumnFilterValue({
              ...dateFilter,
              kind: "date",
              from: event.target.value,
            }))
          }
        />
      </Label>
      <Label className="grid gap-1 text-xs text-muted-foreground">
        To
        <Input
          aria-label={`To ${label}`}
          type="date"
          value={dateFilter.to ?? ""}
          onChange={(event) =>
            column.setFilterValue(cleanColumnFilterValue({
              ...dateFilter,
              kind: "date",
              to: event.target.value,
            }))
          }
        />
      </Label>
    </div>
  );
}

function DataGridBooleanFilter<TData, TValue>({
  column,
  filterValue,
  label,
}: {
  column: Column<TData, TValue>;
  filterValue: unknown;
  label: string;
}) {
  const booleanFilter = isDataGridBooleanFilterValue(filterValue)
    ? filterValue
    : { kind: "boolean" as const };

  return (
    <Label className="grid gap-1 text-xs text-muted-foreground">
      Value
      <SelectDropdown
        aria-label={`Filter ${label}`}
        size="sm"
        value={booleanFilter.value ?? "all"}
        onValueChange={(value) =>
          column.setFilterValue(
            cleanColumnFilterValue({
              kind: "boolean",
              value: value === "true" || value === "false" ? value : undefined,
            }),
          )
        }
        options={[
          { label: "All", value: "all" },
          { label: "True", value: "true" },
          { label: "False", value: "false" },
        ]}
      />
    </Label>
  );
}

function DataGridViewOptions<TData>({
  table,
  className,
  ...props
}: DataGridViewOptionsProps<TData>) {
  const hideableColumns = table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide());

  if (hideableColumns.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-slot="data-grid-view-options"
          className={cn("ml-auto", className)}
          {...props}
        >
          <EyeIcon />
          View
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
          >
            {column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getColumnFilterKind<TData, TValue>(
  column: Column<TData, TValue>,
): DataGridColumnFilterKind | null {
  if (!column.getCanFilter() || column.columnDef.meta?.dataGridFilter === false) {
    return null;
  }

  if (column.columnDef.meta?.dataGridFilter) {
    return column.columnDef.meta.dataGridFilter;
  }

  const values = getColumnSampleValues(column);

  if (values.length === 0) {
    return "text";
  }

  if (values.every((value) => coerceBoolean(value) !== undefined)) {
    return "boolean";
  }

  if (values.every((value) => coerceNumber(value) !== undefined)) {
    return "number";
  }

  if (values.every((value) => isDateLikeValue(value))) {
    return "date";
  }

  return "text";
}

function getColumnFilterLabel<TData, TValue>(column: Column<TData, TValue>) {
  if (typeof column.columnDef.header === "string") {
    return column.columnDef.header;
  }

  return humanizeColumnId(column.id);
}

function getColumnSampleValues<TData, TValue>(column: Column<TData, TValue>) {
  return Array.from(column.getFacetedUniqueValues().keys())
    .filter((value) => !isBlankValue(value))
    .slice(0, 25);
}

function getTextFilterOptions<TData, TValue>(column: Column<TData, TValue>) {
  const options = Array.from(column.getFacetedUniqueValues().entries())
    .filter(([value]) => !isBlankValue(value))
    .map(([value, count]) => ({
      value: String(value),
      label: String(value),
      count,
    }))
    .sort((first, second) => first.label.localeCompare(second.label));

  return options.length <= 12 ? options : [];
}

function getTextFilterValue(filterValue: unknown): DataGridTextFilterValue {
  if (isDataGridTextFilterValue(filterValue)) {
    return filterValue;
  }

  if (typeof filterValue === "string") {
    return { kind: "text", value: filterValue };
  }

  return { kind: "text" };
}

function cleanColumnFilterValue(filterValue: DataGridColumnFilterValue) {
  return isEmptyColumnFilterValue(filterValue) ? undefined : filterValue;
}

function isEmptyColumnFilterValue(filterValue: unknown) {
  if (filterValue == null) {
    return true;
  }

  if (typeof filterValue === "string") {
    return filterValue.trim().length === 0;
  }

  if (isDataGridTextFilterValue(filterValue)) {
    return !filterValue.value?.trim() && !filterValue.values?.length;
  }

  if (isDataGridNumberFilterValue(filterValue)) {
    return !filterValue.min?.trim() && !filterValue.max?.trim();
  }

  if (isDataGridDateFilterValue(filterValue)) {
    return !filterValue.from?.trim() && !filterValue.to?.trim();
  }

  if (isDataGridBooleanFilterValue(filterValue)) {
    return filterValue.value !== "true" && filterValue.value !== "false";
  }

  return false;
}

function isDataGridTextFilterValue(filterValue: unknown): filterValue is DataGridTextFilterValue {
  return isRecord(filterValue) && filterValue.kind === "text";
}

function isDataGridNumberFilterValue(filterValue: unknown): filterValue is DataGridNumberFilterValue {
  return isRecord(filterValue) && filterValue.kind === "number";
}

function isDataGridDateFilterValue(filterValue: unknown): filterValue is DataGridDateFilterValue {
  return isRecord(filterValue) && filterValue.kind === "date";
}

function isDataGridBooleanFilterValue(filterValue: unknown): filterValue is DataGridBooleanFilterValue {
  return isRecord(filterValue) && filterValue.kind === "boolean";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBlankValue(value: unknown) {
  return value == null || String(value).trim().length === 0;
}

function normalizeFilterText(value: unknown) {
  return String(value ?? "").toLocaleLowerCase();
}

function coerceNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function coerceBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLocaleLowerCase() === "true") {
      return true;
    }

    if (value.toLocaleLowerCase() === "false") {
      return false;
    }
  }

  return undefined;
}

function isDateLikeValue(value: unknown) {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime());
  }

  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(value) &&
    coerceDateTimestamp(value) !== undefined
  );
}

function coerceDateTimestamp(value: unknown, endOfDay = false) {
  if (value instanceof Date) {
    const timestamp = value.getTime();

    return Number.isFinite(timestamp) ? timestamp : undefined;
  }

  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const timestamp = Date.parse(
    endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999` : value,
  );

  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function humanizeColumnId(columnId: string) {
  return columnId.replace(/[_-]+/g, " ");
}

export {
  DataGrid,
  DataGridColumnHeader,
  DataGridPagination,
  DataGridToolbar,
  DataGridViewOptions,
};
export type {
  DataGridColumnFilterKind,
  DataGridColumnFilterMeta,
  DataGridControlledState,
  DataGridDensity,
  DataGridProps,
  DataGridServerProps,
  DataGridStatus,
};
