import { describe, expect, test } from "vitest";

import { exampleValue } from "@moritzbrantner/keyboard";

describe("@moritzbrantner/keyboard", () => {
  test("exports the generated entrypoint", () => {
    expect(exampleValue("demo")).toBe("example:demo");
  });
});
