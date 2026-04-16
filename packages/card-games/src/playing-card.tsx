"use client";

import {
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from "react";

import { cx } from "./lib/cx";
import { formatCardLabel, getSuitSymbol, type CardSuit } from "./suit";

type PlayingCardStyle = CSSProperties & Record<string, string | number | undefined>;

export type PlayingCardSize = "sm" | "md" | "lg";
export type PlayingCardTone = "classic" | "midnight" | "emerald" | "rose";
export type PlayingCardEffect = "standard" | "foil" | "glass";
export type PlayingCardFace = "front" | "back";

export interface PlayingCardProps extends HTMLAttributes<HTMLDivElement> {
  rank: string;
  suit?: CardSuit;
  face?: PlayingCardFace;
  size?: PlayingCardSize;
  tone?: PlayingCardTone;
  effect?: PlayingCardEffect;
  interactive?: boolean;
  selected?: boolean;
  headline?: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  artwork?: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
  back?: ReactNode;
}

function updateTilt(
  element: HTMLDivElement,
  event: PointerEvent<HTMLDivElement>,
) {
  const rect = element.getBoundingClientRect();

  if (!rect.width || !rect.height) return;

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const rotateY = ((x / rect.width) - 0.5) * 18;
  const rotateX = (0.5 - y / rect.height) * 18;

  element.style.setProperty("--mb-card-glare-x", `${(x / rect.width) * 100}%`);
  element.style.setProperty("--mb-card-glare-y", `${(y / rect.height) * 100}%`);
  element.style.setProperty("--mb-card-rotate-x", `${rotateX.toFixed(2)}deg`);
  element.style.setProperty("--mb-card-rotate-y", `${rotateY.toFixed(2)}deg`);
}

function resetTilt(element: HTMLDivElement) {
  element.style.setProperty("--mb-card-glare-x", "50%");
  element.style.setProperty("--mb-card-glare-y", "50%");
  element.style.setProperty("--mb-card-rotate-x", "0deg");
  element.style.setProperty("--mb-card-rotate-y", "0deg");
}

export function PlayingCard({
  rank,
  suit,
  face = "front",
  size = "md",
  tone = "classic",
  effect = "standard",
  interactive = true,
  selected = false,
  headline,
  subtitle,
  description,
  artwork,
  badge,
  footer,
  back,
  className,
  children,
  style,
  role,
  onPointerLeave,
  onPointerMove,
  ...divProps
}: PlayingCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const symbol = suit ? getSuitSymbol(suit) : "✦";
  const label = divProps["aria-label"] ?? (face === "back" ? "Card back" : formatCardLabel(rank, suit));

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);

    if (!interactive || !rootRef.current) return;

    updateTilt(rootRef.current, event);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event);

    if (!rootRef.current) return;

    resetTilt(rootRef.current);
  };

  return (
    <div
      {...divProps}
      ref={rootRef}
      aria-label={label}
      className={cx("mb-playing-card", className)}
      data-effect={effect}
      data-face={face}
      data-interactive={interactive}
      data-selected={selected}
      data-size={size}
      data-suit={suit}
      data-tone={tone}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      role={role ?? "img"}
      style={
        {
          ...style,
          "--mb-card-width":
            size === "sm" ? "12rem" : size === "lg" ? "20rem" : "17rem",
        } as PlayingCardStyle
      }
    >
      <div className="mb-playing-card__frame">
        <div className="mb-playing-card__corner" aria-hidden="true">
          <span className="mb-playing-card__rank">{rank}</span>
          <span className="mb-playing-card__symbol">{symbol}</span>
        </div>

        {badge ? <div className="mb-playing-card__badge">{badge}</div> : null}

        <div className="mb-playing-card__body">
          {face === "back" ? (
            <div className="mb-playing-card__back" aria-hidden="true">
              <div className="mb-playing-card__back-inner">
                {back ?? (
                  <>
                    <span className="mb-playing-card__back-mark">{symbol}</span>
                    <span className="mb-playing-card__back-label">Platform deck</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-playing-card__artwork" aria-hidden="true">
                {artwork ?? (
                  <div className="mb-playing-card__default-art">
                    <span className="mb-playing-card__default-symbol">{symbol}</span>
                    <span className="mb-playing-card__default-caption">
                      {suit ? formatCardLabel(rank, suit) : rank}
                    </span>
                  </div>
                )}
              </div>

              {headline || subtitle || description || children ? (
                <div className="mb-playing-card__content">
                  {headline ? (
                    <p className="mb-playing-card__headline">{headline}</p>
                  ) : null}
                  {subtitle ? (
                    <p className="mb-playing-card__subtitle">{subtitle}</p>
                  ) : null}
                  {description ? (
                    <p className="mb-playing-card__description">{description}</p>
                  ) : null}
                  {children ? (
                    <div className="mb-playing-card__children">{children}</div>
                  ) : null}
                </div>
              ) : null}
            </>
          )}

          {footer && face === "front" ? (
            <div className="mb-playing-card__footer">{footer}</div>
          ) : null}
        </div>

        <div
          className="mb-playing-card__corner mb-playing-card__corner--bottom"
          aria-hidden="true"
        >
          <span className="mb-playing-card__rank">{rank}</span>
          <span className="mb-playing-card__symbol">{symbol}</span>
        </div>
      </div>
    </div>
  );
}
