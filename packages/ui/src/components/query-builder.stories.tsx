import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import {
  QueryBuilder,
  type QueryBuilderExpression,
  type QueryBuilderField,
} from "./query-builder";

const fields: QueryBuilderField[] = [
  { id: "name", label: "Dataset name", type: "text" },
  { id: "rows", label: "Rows", type: "number" },
  {
    id: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "Ready", value: "ready" },
      { label: "Review", value: "review" },
      { label: "Blocked", value: "blocked" },
    ],
  },
  { id: "verified", label: "Verified", type: "boolean" },
];

const expression: QueryBuilderExpression = {
  id: "root",
  combinator: "and",
  rules: [
    { id: "rule-status", fieldId: "status", operator: "equals", value: "ready" },
    { id: "rule-rows", fieldId: "rows", operator: "gte", value: 1000 },
  ],
};

const meta = {
  title: "Components/QueryBuilder",
  component: QueryBuilder,
  tags: ["autodocs", "test"],
  args: {
    fields,
    defaultExpression: expression,
    onExpressionChange: fn(),
  },
} satisfies Meta<typeof QueryBuilder>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DatasetFilterQuery: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button", { name: "Add rule" })[0]);
    await expect(args.onExpressionChange).toHaveBeenCalled();
    await userEvent.click(canvas.getAllByRole("button", { name: "Add group" })[0]);
    await expect(args.onExpressionChange).toHaveBeenCalled();
  },
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
  },
};
