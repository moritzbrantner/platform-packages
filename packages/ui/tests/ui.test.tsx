import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Button, Card, CardContent, CardHeader, CardTitle, cn } from "../src";

describe("@platform/ui", () => {
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
});
