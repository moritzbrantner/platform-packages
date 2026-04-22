"use client";

import * as React from "react";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
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
} from "lucide-react";

import { cn } from "../lib/cn";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Input } from "./input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

type DataGridDensity = "compact" | "comfortable" | "spacious";
type DataGridStatus = "idle" | "loading" | "error" | "empty";

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
};

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

const densityClasses: Record<DataGridDensity, string> = {
  compact: "[&_td]:py-1.5 [&_th]:h-8",
  comfortable: "[&_td]:py-2 [&_th]:h-10",
  spacious: "[&_td]:py-3 [&_th]:h-12",
};

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
    setPagination((current) => ({ ...current, pageSize }));
  }, [pageSize]);

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
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
    },
    enableRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
  });

  React.useEffect(() => {
    onSelectedRowsChange?.(table.getSelectedRowModel().rows.map((row) => row.original));
  }, [onSelectedRowsChange, rowSelection, table]);

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
          searchValue={globalFilter}
          onSearchChange={setGlobalFilter}
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
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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

  if (!column.getCanSort()) {
    return <span className={cn("inline-flex items-center", className)}>{title}</span>;
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

export {
  DataGrid,
  DataGridColumnHeader,
  DataGridPagination,
  DataGridToolbar,
  DataGridViewOptions,
};
export type { DataGridDensity, DataGridProps, DataGridStatus };
