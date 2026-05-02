import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CardStack, CardTable, PlayerHand, PlayingCard } from ".";

describe("@moritzbrantner/card-games", () => {
  test("renders a playing card with a generated label", () => {
    render(
      <PlayingCard
        rank="A"
        suit="hearts"
        headline="Fire mage"
        subtitle="Legendary hero"
        description="Deals burst damage when combo chains are active."
        badge="foil"
      />,
    );

    const card = screen.getByRole("img", { name: "A of hearts" });

    expect(card).toBeTruthy();
    expect(screen.getByText("Fire mage")).toBeTruthy();
    expect(screen.getByText("Legendary hero")).toBeTruthy();
    expect(screen.getAllByText("♥").length).toBeGreaterThan(0);
    expect(card.className).toContain("rounded-[1.65rem]");
    expect(card.className).toContain("aspect-[5/7]");
    expect(card.className).toContain("select-none");
    expect(card.className).toContain("whitespace-normal");
    expect(card.className).toContain("w-[var(--mb-card-width)]");
  });

  test("renders layout helpers for hands, piles, and the table surface", () => {
    const { container } = render(
      <CardTable
        aria-label="Demo table"
        title="Night market showdown"
        subtitle="Manual validation surface for stacks, hands, and face-down decks."
      >
        <PlayerHand aria-label="Player hand">
          <PlayingCard rank="Q" suit="spades" size="sm" />
          <PlayingCard rank="7" suit="diamonds" size="sm" effect="foil" />
          <PlayingCard rank="K" suit="clubs" size="sm" />
        </PlayerHand>

        <CardStack aria-label="Draw pile">
          <PlayingCard rank="?" suit="joker" size="sm" face="back" />
          <PlayingCard rank="?" suit="joker" size="sm" face="back" />
        </CardStack>
      </CardTable>,
    );

    expect(screen.getByText("Night market showdown")).toBeTruthy();
    expect(screen.getByLabelText("Player hand")).toBeTruthy();
    expect(screen.getByLabelText("Draw pile")).toBeTruthy();
    expect(container.querySelector(".mb-player-hand")).toBeTruthy();
    expect(container.querySelectorAll(".mb-card-fan__item")).toHaveLength(3);
    expect(container.querySelectorAll(".mb-card-stack__item")).toHaveLength(2);
    expect(screen.getAllByRole("img", { name: "Card back" })).toHaveLength(2);
  });

  test("uses the workspace bun lockfile and does not export a standalone stylesheet", () => {
    const packageDir = path.resolve(process.cwd(), "packages/card-games");
    const lockfilePath = path.resolve(process.cwd(), "bun.lock");
    const packageJsonPath = path.resolve(packageDir, "package.json");
    const packageStylePath = path.resolve(packageDir, "styles.css");
    const lockfile = readFileSync(lockfilePath, "utf8");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      exports?: Record<string, { import: string; types: string }>;
      files?: string[];
    };

    expect(existsSync(lockfilePath)).toBe(true);
    expect(lockfile).toContain('"packages/card-games"');
    expect(lockfile).toContain('"@moritzbrantner/card-games": "workspace:*"');
    expect(packageJson.files).toEqual(["dist"]);
    expect(packageJson.exports).toEqual({
      ".": {
        import: "./dist/index.js",
        types: "./dist/index.d.ts",
      },
    });
    expect(existsSync(packageStylePath)).toBe(false);
  });
});
