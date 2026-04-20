import { useState, type ReactNode } from "react";

import {
  CardStack,
  CardTable,
  PlayerHand,
  PlayingCard,
  type CardSuit,
  type PlayingCardEffect,
  type PlayingCardTone,
} from "@moritzbrantner/card-games";
import {
  Badge,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@moritzbrantner/ui";

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

type FieldCard = ShowcaseCard & {
  id: string;
};

type FieldSlotId = "vanguard" | "support" | "reserve";

type SelectedMove =
  | { zone: "hand"; cardId: string }
  | { zone: "field"; cardId: string; slotId: FieldSlotId };

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

const fieldDeck: FieldCard[] = [
  {
    id: "ember-ace",
    rank: "A",
    suit: "hearts",
    headline: "Ember ace",
    subtitle: "Strike",
    description: "A fast opener for the front line.",
    tone: "rose",
    effect: "foil",
  },
  {
    id: "gate-seven",
    rank: "7",
    suit: "spades",
    headline: "Gate seven",
    subtitle: "Control",
    description: "Locks a lane until the next turn.",
    tone: "midnight",
  },
  {
    id: "wild-jack",
    rank: "J",
    suit: "joker",
    headline: "Wild jack",
    subtitle: "Trick",
    description: "Moves between open field positions.",
    tone: "classic",
    effect: "glass",
  },
  {
    id: "warden-king",
    rank: "K",
    suit: "clubs",
    headline: "Warden king",
    subtitle: "Guard",
    description: "Holds the reserve lane.",
    tone: "emerald",
  },
  {
    id: "coin-nine",
    rank: "9",
    suit: "diamonds",
    headline: "Coin nine",
    subtitle: "Tempo",
    description: "Converts a field slot into pressure.",
    tone: "classic",
  },
];

const fieldSlots: Array<{ id: FieldSlotId; label: string }> = [
  { id: "vanguard", label: "Vanguard" },
  { id: "support", label: "Support" },
  { id: "reserve", label: "Reserve" },
];

function createEmptyField(): Record<FieldSlotId, FieldCard | null> {
  return {
    reserve: null,
    support: null,
    vanguard: null,
  };
}

function CardGamesPage() {
  const [selectedCard, setSelectedCard] = useState(0);
  const [lastAction, setLastAction] = useState("No action taken");
  const [drawPile, setDrawPile] = useState<FieldCard[]>(fieldDeck);
  const [fieldHand, setFieldHand] = useState<FieldCard[]>([]);
  const [fieldCards, setFieldCards] = useState(createEmptyField);
  const [discardPile, setDiscardPile] = useState<FieldCard[]>([]);
  const [selectedMove, setSelectedMove] = useState<SelectedMove | null>(null);

  const activeCard = openingHand[selectedCard] ?? openingHand[0];
  const selectedFieldCard =
    selectedMove?.zone === "hand"
      ? fieldHand.find((card) => card.id === selectedMove.cardId)
      : selectedMove?.zone === "field"
        ? fieldCards[selectedMove.slotId]
        : undefined;

  const runDefaultAction = (card: ShowcaseCard) => {
    setLastAction(`Played ${card.headline}`);
  };

  const drawCard = () => {
    const [nextCard, ...remainingDrawPile] = drawPile;

    if (!nextCard) return;

    setDrawPile(remainingDrawPile);
    setFieldHand([...fieldHand, nextCard]);
    setSelectedMove({ zone: "hand", cardId: nextCard.id });
  };

  const selectHandCard = (card: FieldCard) => {
    setSelectedMove({ zone: "hand", cardId: card.id });
  };

  const selectFieldCard = (slotId: FieldSlotId, card: FieldCard) => {
    setSelectedMove({ zone: "field", cardId: card.id, slotId });
  };

  const placeSelectedCard = (slotId: FieldSlotId) => {
    if (!selectedMove || !selectedFieldCard) return;

    const displacedCard = fieldCards[slotId];

    setFieldCards({
      ...fieldCards,
      ...(selectedMove.zone === "field" ? { [selectedMove.slotId]: null } : {}),
      [slotId]: selectedFieldCard,
    });

    if (selectedMove.zone === "hand") {
      setFieldHand(fieldHand.filter((card) => card.id !== selectedMove.cardId));
    }

    if (displacedCard && displacedCard.id !== selectedFieldCard.id) {
      setDiscardPile([displacedCard, ...discardPile]);
    }

    setSelectedMove({ zone: "field", cardId: selectedFieldCard.id, slotId });
  };

  const discardSelectedCard = () => {
    if (!selectedMove || !selectedFieldCard) return;

    if (selectedMove.zone === "hand") {
      setFieldHand(fieldHand.filter((card) => card.id !== selectedMove.cardId));
    } else {
      setFieldCards({ ...fieldCards, [selectedMove.slotId]: null });
    }

    setDiscardPile([selectedFieldCard, ...discardPile]);
    setSelectedMove(null);
  };

  const returnSelectedCardToHand = () => {
    if (selectedMove?.zone !== "field" || !selectedFieldCard) return;

    setFieldCards({ ...fieldCards, [selectedMove.slotId]: null });
    setFieldHand([...fieldHand, selectedFieldCard]);
    setSelectedMove({ zone: "hand", cardId: selectedFieldCard.id });
  };

  const resetField = () => {
    setDrawPile(fieldDeck);
    setFieldHand([]);
    setFieldCards(createEmptyField());
    setDiscardPile([]);
    setSelectedMove(null);
  };

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
          <PlayerHand aria-label="Player hand">
            {openingHand.map((card, index) => (
              <button
                key={`${card.rank}-${card.suit}`}
                type="button"
                aria-label={`Select ${card.headline}`}
                className="block select-none rounded-[1.8rem] bg-transparent p-0 text-left outline-none transition-transform duration-200 ease-out focus-visible:ring-2 focus-visible:ring-white/80"
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
          </PlayerHand>
        </CardTable>

        <CardTable
          eyebrow="Focus card"
          title={activeCard.headline}
          subtitle="Use the same component for a larger featured view."
          tone="midnight"
        >
          <div className="grid justify-items-center gap-4">
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Play ${activeCard.headline}`}
                  className="block select-none rounded-[1.8rem] bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                  onClick={() => runDefaultAction(activeCard)}
                >
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
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuLabel>{activeCard.headline}</ContextMenuLabel>
                <ContextMenuItem onSelect={() => runDefaultAction(activeCard)}>
                  Play card
                </ContextMenuItem>
                <ContextMenuItem
                  onSelect={() => setLastAction(`Held ${activeCard.headline}`)}
                >
                  Hold card
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onSelect={() => setLastAction(`Discarded ${activeCard.headline}`)}
                >
                  Discard card
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
            <p className="text-sm font-semibold text-white/78" aria-live="polite">
              {lastAction}
            </p>
          </div>
        </CardTable>
      </div>

      <CardTable
        className="mt-6"
        eyebrow="Playing field"
        title="Move cards"
        subtitle="Deck lanes, a hand rail, named board slots, and a discard column share one table state."
        tone="emerald"
      >
        <div className="grid gap-5 xl:grid-cols-[0.75fr_1.5fr_0.85fr]">
          <div className="grid gap-4 content-start">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-white/82">Draw pile</p>
                <span className="rounded-full bg-white/12 px-2.5 py-1 text-xs font-bold text-white/74">
                  {drawPile.length}
                </span>
              </div>
              <button
                type="button"
                aria-label="Draw card"
                className="grid min-h-[19rem] w-full select-none place-items-center rounded-lg border border-white/18 bg-white/8 p-3 outline-none transition-colors hover:bg-white/12 focus-visible:ring-2 focus-visible:ring-white/80 disabled:cursor-not-allowed disabled:opacity-55"
                onClick={drawCard}
                disabled={drawPile.length === 0}
              >
                {drawPile.length > 0 ? (
                  <CardStack aria-hidden="true" offsetX={9} offsetY={8} rotateStep={2}>
                    {drawPile.slice(0, 3).map((card) => (
                      <PlayingCard
                        key={card.id}
                        rank="?"
                        suit="joker"
                        face="back"
                        size="sm"
                        tone="midnight"
                        interactive={false}
                      />
                    ))}
                  </CardStack>
                ) : (
                  <span className="text-sm font-bold text-white/62">Empty</span>
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md bg-white px-3 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-white/86 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={discardSelectedCard}
                disabled={!selectedMove}
              >
                Discard
              </button>
              <button
                type="button"
                className="rounded-md border border-white/28 bg-white/10 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={returnSelectedCardToHand}
                disabled={selectedMove?.zone !== "field"}
              >
                Return
              </button>
              <button
                type="button"
                className="rounded-md border border-white/28 bg-white/10 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-white/16"
                onClick={resetField}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid gap-4 content-start">
            <div className="grid gap-3 md:grid-cols-3">
              {fieldSlots.map((slot) => {
                const card = fieldCards[slot.id];
                const isSelected = selectedMove?.zone === "field" && selectedMove.slotId === slot.id;

                return (
                  <div key={slot.id} className="grid gap-2">
                    <p className="text-center text-sm font-bold text-white/82">
                      {slot.label}
                    </p>
                    <button
                      type="button"
                      aria-label={`${slot.label} field slot`}
                      className="grid min-h-[19rem] w-full select-none place-items-center rounded-lg border border-dashed border-white/24 bg-black/10 p-3 outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/80"
                      onClick={() => {
                        if (card && (!selectedMove || selectedMove.cardId === card.id)) {
                          selectFieldCard(slot.id, card);
                          return;
                        }

                        placeSelectedCard(slot.id);
                      }}
                    >
                      {card ? (
                        <PlayingCard
                          rank={card.rank}
                          suit={card.suit}
                          size="sm"
                          tone={card.tone}
                          effect={card.effect}
                          headline={card.headline}
                          subtitle={card.subtitle}
                          description={card.description}
                          selected={isSelected}
                          interactive={false}
                        />
                      ) : (
                        <span className="text-sm font-bold text-white/58">Open</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-white/82">Player hand</p>
                <span className="rounded-full bg-white/12 px-2.5 py-1 text-xs font-bold text-white/74">
                  {fieldHand.length}
                </span>
              </div>
              <PlayerHand aria-label="Playing field hand" className="min-h-[14rem] rounded-lg border border-white/14 bg-white/8">
                {fieldHand.length > 0 ? (
                  fieldHand.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      aria-label={`Select ${card.headline}`}
                      className="block select-none rounded-[1.8rem] bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                      onClick={() => selectHandCard(card)}
                    >
                      <PlayingCard
                        rank={card.rank}
                        suit={card.suit}
                        size="sm"
                        tone={card.tone}
                        effect={card.effect}
                        headline={card.headline}
                        subtitle={card.subtitle}
                        description={card.description}
                        selected={
                          selectedMove?.zone === "hand" && selectedMove.cardId === card.id
                        }
                        interactive={false}
                      />
                    </button>
                  ))
                ) : (
                  <span className="grid min-h-[11rem] place-items-center text-sm font-bold text-white/58">
                    Empty
                  </span>
                )}
              </PlayerHand>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-white/82">Discard pile</p>
              <span className="rounded-full bg-white/12 px-2.5 py-1 text-xs font-bold text-white/74">
                {discardPile.length}
              </span>
            </div>
            <button
              type="button"
              aria-label="Discard selected card"
              className="grid min-h-[19rem] w-full select-none place-items-center rounded-lg border border-white/18 bg-white/8 p-3 outline-none transition-colors hover:bg-white/12 focus-visible:ring-2 focus-visible:ring-white/80 disabled:cursor-not-allowed disabled:opacity-55"
              onClick={discardSelectedCard}
              disabled={!selectedMove}
            >
              {discardPile.length > 0 ? (
                <CardStack aria-hidden="true" offsetX={10} offsetY={10} rotateStep={5}>
                  {discardPile
                    .slice(0, 3)
                    .reverse()
                    .map((card) => (
                      <PlayingCard
                        key={card.id}
                        rank={card.rank}
                        suit={card.suit}
                        size="sm"
                        tone={card.tone}
                        effect={card.effect}
                        headline={card.headline}
                        subtitle={card.subtitle}
                        interactive={false}
                      />
                    ))}
                </CardStack>
              ) : (
                <span className="text-sm font-bold text-white/62">Empty</span>
              )}
            </button>
          </div>
        </div>
      </CardTable>

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
              description="Static sheen over a dark face."
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
