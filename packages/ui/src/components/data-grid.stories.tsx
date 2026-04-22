import type { ColumnDef } from "@tanstack/react-table";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type * as React from "react";
import { expect, fn } from "storybook/test";

import { Badge } from "./badge";
import { DataGrid, DataGridColumnHeader } from "./data-grid";

type Invoice = {
  id: string;
  customer: string;
  status: "paid" | "pending" | "overdue";
  total: number;
};

const invoices: Invoice[] = [
  { id: "INV-1001", customer: "Acme Studio", status: "paid", total: 4200 },
  { id: "INV-1002", customer: "Northwind", status: "pending", total: 1800 },
  { id: "INV-1003", customer: "Globex", status: "overdue", total: 960 },
  { id: "INV-1004", customer: "Umbrella", status: "paid", total: 3100 },
];

const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <DataGridColumnHeader column={column} title="Invoice" />,
    cell: ({ row }) => <span className="font-medium">{row.original.id}</span>,
  },
  {
    accessorKey: "customer",
    header: ({ column }) => <DataGridColumnHeader column={column} title="Customer" />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
  },
  {
    accessorKey: "total",
    header: ({ column }) => <DataGridColumnHeader column={column} title="Total" />,
    cell: ({ row }) => `$${row.original.total.toLocaleString()}`,
  },
];

function DataGridDemo({
  onSelectedRowsChange,
  loading,
  error,
}: {
  onSelectedRowsChange?: (rows: Invoice[]) => void;
  loading?: boolean;
  error?: React.ReactNode;
}) {
  return (
    <DataGrid
      columns={columns}
      data={loading || error ? [] : invoices}
      enableRowSelection
      pageSize={2}
      loading={loading}
      error={error}
      onSelectedRowsChange={onSelectedRowsChange}
      className="max-w-4xl"
    />
  );
}

const meta = {
  title: "Components/DataGrid",
  component: DataGridDemo,
  tags: ["autodocs", "test"],
  args: {
    onSelectedRowsChange: fn(),
  },
} satisfies Meta<typeof DataGrid<Invoice>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Search rows"), "Acme");
    await expect(canvas.getByText("Acme Studio")).toBeInTheDocument();
    await expect(canvas.queryByText("Northwind")).not.toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const ErrorState: Story = {
  args: {
    error: "Could not load invoices.",
  },
};
