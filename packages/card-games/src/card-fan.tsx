"use client";

import { Children, type CSSProperties, type HTMLAttributes } from "react";

import { cx } from "./lib/cx";

type CardFanStyle = CSSProperties & Record<string, string | number | undefined>;

export interface CardFanProps extends HTMLAttributes<HTMLDivElement> {
  spreadDegrees?: number;
  overlap?: number;
  curve?: number;
  hoverLift?: number;
}

export function CardFan({
  children,
  className,
  spreadDegrees = 26,
  overlap = 56,
  curve = 18,
  hoverLift = 18,
  style,
  ...divProps
}: CardFanProps) {
  const items = Children.toArray(children);
  const half = Math.max(items.length - 1, 0) / 2;
  const step = items.length > 1 ? spreadDegrees / (items.length - 1) : 0;

  return (
    <div {...divProps} className={cx("mb-card-fan", className)} style={style}>
      {items.map((child, index) => {
        const distanceFromCenter = index - half;
        const rotate = distanceFromCenter * step;
        const raise = -Math.abs(distanceFromCenter) * curve;

        return (
          <div
            key={index}
            className="mb-card-fan__item"
            style={
              {
                "--mb-fan-hover-lift": `${hoverLift}px`,
                "--mb-fan-raise": `${raise}px`,
                "--mb-fan-rotate": `${rotate}deg`,
                marginInlineStart: index === 0 ? "0px" : `${-overlap}px`,
                zIndex: Math.round(100 - Math.abs(distanceFromCenter) * 10),
              } as CardFanStyle
            }
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
