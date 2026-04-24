import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Keyboard } from "./keyboard";

const keyboardRows = [
  {
    id: "function",
    keys: [
      { label: "Esc", tone: "muted" },
      { label: "1", hint: "!" },
      { label: "2", hint: "@" },
      { label: "3", hint: "#" },
      { label: "4", hint: "$" },
      { label: "5", hint: "%" },
      { label: "6", hint: "^" },
      { label: "7", hint: "&" },
      { label: "8", hint: "*" },
      { label: "9", hint: "(" },
      { label: "0", hint: ")" },
      { label: "Delete", span: 2, align: "start", tone: "muted" },
    ],
  },
  {
    id: "top",
    keys: [
      { label: "Tab", span: 1.5, align: "start", tone: "muted" },
      { label: "Q" },
      { label: "W" },
      { label: "E", pressed: true, tone: "accent" },
      { label: "R" },
      { label: "T" },
      { label: "Y" },
      { label: "U" },
      { label: "I" },
      { label: "O" },
      { label: "P" },
      { label: "\\", hint: "|" },
    ],
  },
  {
    id: "home",
    keys: [
      { label: "Caps", span: 1.8, align: "start", tone: "muted" },
      { label: "A" },
      { label: "S" },
      { label: "D", pressed: true, tone: "accent" },
      { label: "F" },
      { label: "G" },
      { label: "H" },
      { label: "J" },
      { label: "K" },
      { label: "L" },
      { label: "Enter", span: 2.2, align: "end", tone: "muted" },
    ],
  },
  {
    id: "bottom",
    keys: [
      { label: "Shift", span: 2.2, align: "start", tone: "muted" },
      { label: "Z" },
      { label: "X" },
      { label: "C" },
      { label: "V" },
      { label: "B" },
      { label: "N" },
      { label: "M" },
      { label: ",", hint: "<" },
      { label: ".", hint: ">" },
      { label: "/", hint: "?" },
      { label: "Shift", span: 2.6, align: "end", tone: "muted" },
    ],
  },
  {
    id: "space",
    keys: [
      { label: "Ctrl", tone: "muted" },
      { label: "Alt", tone: "muted" },
      { label: "Space", span: 6.4, pressed: true, tone: "accent" },
      { label: "Fn", tone: "muted", disabled: true },
      { label: "Cmd", tone: "muted" },
    ],
  },
] as const;

const meta = {
  title: "Components/Keyboard",
  component: Keyboard,
  tags: ["autodocs", "test"],
  args: {
    rows: keyboardRows,
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Keyboard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Delete")).toBeVisible();
    await expect(canvas.getByText("Space")).toBeVisible();
    await expect(canvas.getAllByText("Shift")).toHaveLength(2);
  },
};

export const Compact: Story = {
  args: {
    size: "sm",
    rows: [
      {
        keys: [
          { label: "1", hint: "!" },
          { label: "2", hint: "@" },
          { label: "3", hint: "#" },
          { label: "4", hint: "$" },
        ],
      },
      {
        keys: [
          { label: "A", pressed: true, tone: "accent" },
          { label: "S" },
          { label: "D" },
          { label: "F" },
        ],
      },
    ],
  },
};
