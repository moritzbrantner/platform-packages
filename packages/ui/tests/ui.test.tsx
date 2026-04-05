import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import {
  Button,
  Calendar,
  CalendarDayButton,
  type CalendarCellComponentProps,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
} from "../src";

describe("@moritzbrantner/ui", () => {
  test("renders shared primitives in jsdom", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Shared UI</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Press</Button>
        </CardContent>
      </Card>,
    );

    expect(screen.getByRole("button", { name: "Press" })).toBeTruthy();
    expect(screen.getByText("Shared UI")).toBeTruthy();
  });

  test("merges class names", () => {
    expect(cn("px-4", "px-2", "font-semibold")).toBe("px-2 font-semibold");
  });

  test("renders a custom calendar cell component", () => {
    function CustomCell({
      children,
      ...props
    }: CalendarCellComponentProps) {
      return (
        <CalendarDayButton {...props}>
          {children}
          <span data-testid={`cell-${props.day.date.getDate()}`}>marker</span>
        </CalendarDayButton>
      );
    }

    render(
      <Calendar
        defaultMonth={new Date(2024, 0, 1)}
        mode="single"
        showOutsideDays={false}
        cellComponent={CustomCell}
      />,
    );

    expect(screen.getByTestId("cell-15")).toBeTruthy();
  });
});
