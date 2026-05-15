import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { SearchField } from "..";

describe("search field", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("supports uncontrolled and clear interactions", () => {
    const onValueChange = vi.fn();

    render(<SearchField defaultValue="old" onValueChange={onValueChange} />);

    const input = screen.getByLabelText("Search") as HTMLInputElement;

    expect(input.value).toBe("old");

    fireEvent.change(input, { target: { value: "new" } });

    expect(input.value).toBe("new");
    expect(onValueChange).toHaveBeenCalledWith("new");

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(input.value).toBe("");
    expect(onValueChange).toHaveBeenCalledWith("");
  });

  test("supports controlled value and debounced callbacks", () => {
    vi.useFakeTimers();

    const onDebouncedValueChange = vi.fn();

    render(
      <SearchField value="query" onDebouncedValueChange={onDebouncedValueChange} debounceMs={100} />,
    );

    vi.advanceTimersByTime(99);
    expect(onDebouncedValueChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onDebouncedValueChange).toHaveBeenCalledWith("query");
  });

  test("renders loading, result count, and shortcut", () => {
    render(<SearchField loading resultCount={3} shortcut="/" />);

    expect(screen.getByText("3 results")).toBeTruthy();
    expect(screen.getByText("/")).toBeTruthy();
  });
});
