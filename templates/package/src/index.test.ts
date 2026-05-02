import { describe, expect, test } from "vitest";

import { exampleValue } from "@__SCOPE__/__PACKAGE_NAME__";

describe("@__SCOPE__/__PACKAGE_NAME__", () => {
  test("exports the generated entrypoint", () => {
    expect(exampleValue("demo")).toBe("example:demo");
  });
});
