import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Calendar, type CalendarIcsData } from "./calendar";

const calendarIcsData = [
  "vcalendar",
  [
    ["version", {}, "text", "2.0"],
    ["prodid", {}, "text", "-//platform-packages//Storybook Calendar//EN"],
  ],
  [
    [
      "vevent",
      [
        ["uid", {}, "text", "design-sync"],
        ["summary", {}, "text", "Design sync"],
        ["dtstart", {}, "date-time", "2026-04-15T09:00:00Z"],
        ["dtend", {}, "date-time", "2026-04-15T09:30:00Z"],
      ],
      [],
    ],
    [
      "vevent",
      [
        ["uid", {}, "text", "release-window"],
        ["summary", {}, "text", "Release window"],
        ["dtstart", {}, "date", "2026-04-18"],
        ["dtend", {}, "date", "2026-04-20"],
      ],
      [],
    ],
  ],
] as const satisfies CalendarIcsData;

const meta = {
  title: "Components/Calendar",
  component: Calendar,
  tags: ["autodocs", "test"],
  args: {
    defaultMonth: new Date(2026, 3, 1),
    mode: "single",
    showOutsideDays: false,
    icsData: calendarIcsData,
  },
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithEvents: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText(/Design sync/).length).toBeGreaterThan(0);
    await expect(canvas.getAllByText("Release window").length).toBeGreaterThan(1);
  },
};

export const CardDays: Story = {
  args: {
    variant: "cards",
    maxEventsPerDay: 4,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText(/Design sync/).length).toBeGreaterThan(0);
    await expect(canvas.getAllByText("All day").length).toBeGreaterThan(0);
  },
};

export const RangeSelection: Story = {
  args: {
    mode: "range",
    selected: {
      from: new Date(2026, 3, 14),
      to: new Date(2026, 3, 18),
    },
  },
};
