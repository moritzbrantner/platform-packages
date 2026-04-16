import { useState, type ReactNode } from "react";

import {
  CardFan,
  CardStack,
  CardTable,
  PlayingCard,
  type CardSuit,
  type PlayingCardEffect,
  type PlayingCardTone,
} from "@moritzbrantner/card-games";
import { Badge } from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

type ShowcaseCard = {
  rank: string;
  suit: CardSuit;
  headline: string;
  subtitle: string;
  description: string;
  badge?: ReactNode;
  effect?: PlayingCardEffect;
  tone?: PlayingCardTone;
};

const openingHand: ShowcaseCard[] = [
  {
    rank: "A",
    suit: "hearts",
    headline: "Phoenix dive",
    subtitle: "Finisher",
    description: "Burns the frontline and redraws one card if the chain is active.",
    badge: "foil",
    effect: "foil",
    tone: "rose",
  },
  {
    rank: "7",
    suit: "spades",
    headline: "Night courier",
    subtitle: "Scout",
    description: "Reveals the next trap and gains stealth while unblocked.",
    effect: "glass",
    tone: "midnight",
  },
  {
    rank: "K",
    suit: "clubs",
    headline: "Canopy warden",
    subtitle: "Tank",
    description: "Redirects incoming damage and fortifies adjacent allies.",
    tone: "emerald",
  },
  {
    rank: "J",
    suit: "diamonds",
    headline: "Market saboteur",
    subtitle: "Utility",
    description: "Steals tempo by blanking the first reaction this turn.",
    effect: "foil",
  },
] as const;

function CardGamesPage() {
  const [selectedCard, setSelectedCard] = useState(0);

  const activeCard = openingHand[selectedCard] ?? openingHand[0];

  return (
    <PlaygroundPage
      activePage="card-games"
      title="Card games package examples"
      description="A purpose-built surface for collectible-card and tabletop UI work. It covers tactile hover motion, premium finishes, deck composition helpers, and a reusable table backdrop."
    >
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <CardTable
          eyebrow="@moritzbrantner/card-games"
          title="Player hand"
          subtitle="Hover any card to inspect the tilt response. Click a card to pin it into the detail panel."
          tone="emerald"
        >
          <CardFan aria-label="Opening hand" className="justify-start overflow-x-auto">
            {openingHand.map((card, index) => (
              <button
                key={`${card.rank}-${card.suit}`}
                type="button"
                aria-label={`Select ${card.headline}`}
                className="rounded-[1.8rem] bg-transparent p-0 text-left"
                onClick={() => setSelectedCard(index)}
              >
                <PlayingCard
                  rank={card.rank}
                  suit={card.suit}
                  size="sm"
                  effect={card.effect}
                  tone={card.tone}
                  headline={card.headline}
                  subtitle={card.subtitle}
                  description={card.description}
                  badge={card.badge}
                  selected={selectedCard === index}
                />
              </button>
            ))}
          </CardFan>
        </CardTable>

        <CardTable
          eyebrow="Focus card"
          title={activeCard.headline}
          subtitle="Use the same component for a larger featured view."
          tone="midnight"
        >
          <div className="flex justify-center">
            <PlayingCard
              rank={activeCard.rank}
              suit={activeCard.suit}
              size="lg"
              effect={activeCard.effect}
              tone={activeCard.tone}
              headline={activeCard.headline}
              subtitle={activeCard.subtitle}
              description={activeCard.description}
              badge={activeCard.badge}
              footer={
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary">Attack 7</Badge>
                  <Badge variant="outline">Shield 3</Badge>
                </div>
              }
            />
          </div>
        </CardTable>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <CardTable
          eyebrow="Deck states"
          title="Draw and discard piles"
          subtitle="Face-down cards work as deck backs without needing a second component."
          tone="crimson"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium text-white/80">Draw pile</p>
              <CardStack aria-label="Draw pile">
                <PlayingCard rank="?" suit="joker" face="back" size="sm" tone="midnight" />
                <PlayingCard rank="?" suit="joker" face="back" size="sm" tone="midnight" />
                <PlayingCard rank="?" suit="joker" face="back" size="sm" tone="midnight" />
              </CardStack>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-white/80">Discard pile</p>
              <CardStack aria-label="Discard pile" offsetX={10} offsetY={10} rotateStep={5}>
                <PlayingCard rank="4" suit="clubs" size="sm" tone="emerald" />
                <PlayingCard rank="9" suit="hearts" size="sm" tone="rose" effect="foil" />
                <PlayingCard rank="Q" suit="spades" size="sm" tone="midnight" />
              </CardStack>
            </div>
          </div>
        </CardTable>

        <CardTable
          eyebrow="Style variants"
          title="Finishes"
          subtitle="The package intentionally supports a few clear visual modes instead of a vague generic card."
          tone="midnight"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <PlayingCard
              rank="8"
              suit="diamonds"
              size="sm"
              headline="Classic"
              subtitle="Default finish"
              description="Strong contrast and neutral framing."
            />
            <PlayingCard
              rank="10"
              suit="spades"
              size="sm"
              effect="foil"
              tone="midnight"
              headline="Foil"
              subtitle="Premium sheen"
              description="Tracks glare with pointer movement."
            />
            <PlayingCard
              rank="J"
              suit="joker"
              size="sm"
              effect="glass"
              tone="rose"
              headline="Glass"
              subtitle="Layered gloss"
              description="Useful for rare or magical variants."
            />
          </div>
        </CardTable>
      </div>
    </PlaygroundPage>
  );
}

mountPage(<CardGamesPage />);
