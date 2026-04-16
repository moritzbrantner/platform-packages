"use client";

import { Children, type CSSProperties, type HTMLAttributes } from "react";

import { cx } from "./lib/cx";

type CardStackStyle = CSSProperties & Record<string, string | number | undefined>;

export interface CardStackProps extends HTMLAttributes<HTMLDivElement> {
  offsetX?: number;
  offsetY?: number;
  rotateStep?: number;
}

export function CardStack({
  children,
  className,
  offsetX = 16,
  offsetY = 12,
  rotateStep = 3.5,
  style,
  ...divProps
}: CardStackProps) {
  const items = Children.toArray(children);
  const half = Math.max(items.length - 1, 0) / 2;

  return (
    <div {...divProps} className={cx("mb-card-stack", className)} style={style}>
      {items.map((child, index) => {
        const distanceFromCenter = index - half;

        return (
          <div
            key={index}
            className="mb-card-stack__item"
            style={
              {
                "--mb-stack-rotate": `${distanceFromCenter * rotateStep}deg`,
                "--mb-stack-x": `${index * offsetX}px`,
                "--mb-stack-y": `${index * offsetY}px`,
                zIndex: index + 1,
              } as CardStackStyle
            }
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
