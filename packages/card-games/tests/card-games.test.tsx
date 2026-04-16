import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CardFan, CardStack, CardTable, PlayingCard } from "../src";

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

    expect(screen.getByRole("img", { name: "A of hearts" })).toBeTruthy();
    expect(screen.getByText("Fire mage")).toBeTruthy();
    expect(screen.getByText("Legendary hero")).toBeTruthy();
    expect(screen.getAllByText("♥").length).toBeGreaterThan(0);
  });

  test("renders layout helpers for hands, piles, and the table surface", () => {
    const { container } = render(
      <CardTable
        aria-label="Demo table"
        title="Night market showdown"
        subtitle="Manual validation surface for stacks, hands, and face-down decks."
      >
        <CardFan aria-label="Player hand">
          <PlayingCard rank="Q" suit="spades" size="sm" />
          <PlayingCard rank="7" suit="diamonds" size="sm" effect="foil" />
          <PlayingCard rank="K" suit="clubs" size="sm" />
        </CardFan>

        <CardStack aria-label="Draw pile">
          <PlayingCard rank="?" suit="joker" size="sm" face="back" />
          <PlayingCard rank="?" suit="joker" size="sm" face="back" />
        </CardStack>
      </CardTable>,
    );

    expect(screen.getByText("Night market showdown")).toBeTruthy();
    expect(screen.getByLabelText("Player hand")).toBeTruthy();
    expect(screen.getByLabelText("Draw pile")).toBeTruthy();
    expect(container.querySelectorAll(".mb-card-fan__item")).toHaveLength(3);
    expect(container.querySelectorAll(".mb-card-stack__item")).toHaveLength(2);
    expect(screen.getAllByRole("img", { name: "Card back" })).toHaveLength(2);
  });
});
