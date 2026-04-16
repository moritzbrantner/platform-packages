"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import { cx } from "./lib/cx";

export type CardTableTone = "emerald" | "midnight" | "crimson";

export interface CardTableProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  eyebrow?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  tone?: CardTableTone;
}

export function CardTable({
  eyebrow,
  title,
  subtitle,
  tone = "emerald",
  className,
  children,
  style,
  ...divProps
}: CardTableProps) {
  return (
    <div
      {...divProps}
      className={cx("mb-card-table", className)}
      data-tone={tone}
      style={style as CSSProperties}
    >
      {eyebrow || title || subtitle ? (
        <header className="mb-card-table__header">
          <div>
            {eyebrow ? <p className="mb-card-table__eyebrow">{eyebrow}</p> : null}
            {title ? <h2 className="mb-card-table__title">{title}</h2> : null}
            {subtitle ? <p className="mb-card-table__subtitle">{subtitle}</p> : null}
          </div>
        </header>
      ) : null}

      <div className="mb-card-table__content">{children}</div>
    </div>
  );
}
