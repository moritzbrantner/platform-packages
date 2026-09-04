import type { HTMLAttributes, ReactNode } from "react";

export type MultilingualTextColumn = {
  id: string;
  label: string;
  lang?: string;
  dir?: HTMLAttributes<HTMLElement>["dir"];
};

export type MultilingualTextSegment = {
  id?: string;
  cells: Readonly<Record<string, ReactNode>>;
};

export type MultilingualTextProps = Omit<HTMLAttributes<HTMLOListElement>, "children"> & {
  columns: readonly MultilingualTextColumn[];
  segments: readonly MultilingualTextSegment[];
  emptyCell?: ReactNode;
};

export type ParallelTextSegment = {
  id?: string;
  source: ReactNode;
  target: ReactNode;
};

export type ParallelTextProps = Omit<HTMLAttributes<HTMLOListElement>, "children"> & {
  sourceLabel: string;
  targetLabel: string;
  sourceLang?: string;
  targetLang?: string;
  sourceDir?: HTMLAttributes<HTMLElement>["dir"];
  targetDir?: HTMLAttributes<HTMLElement>["dir"];
  segments: readonly ParallelTextSegment[];
};

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function getSegmentId(index: number, segment: MultilingualTextSegment) {
  return segment.id ?? `segment-${index + 1}`;
}

export function MultilingualText({
  columns,
  segments,
  emptyCell = null,
  className,
  ...listProps
}: MultilingualTextProps) {
  return (
    <ol
      {...listProps}
      data-slot="multilingual-text"
      className={joinClassNames("grid min-w-0 gap-4", className)}
    >
      {segments.map((segment, index) => {
        const segmentId = getSegmentId(index, segment);

        return (
          <li
            id={segmentId}
            key={segmentId}
            data-segment-id={segmentId}
            className="grid min-w-0 gap-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4 text-[color:var(--card-foreground)] shadow-sm [grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))]"
          >
            {columns.map((column) => (
              <section
                key={column.id}
                data-column-id={column.id}
                lang={column.lang}
                dir={column.dir}
                className="min-w-0"
              >
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                  {column.label}
                </p>
                <div className="mt-3 min-w-0 text-[0.98rem] leading-8">
                  {segment.cells[column.id] ?? emptyCell}
                </div>
              </section>
            ))}
          </li>
        );
      })}
    </ol>
  );
}

export function ParallelText({
  sourceLabel,
  targetLabel,
  sourceLang,
  targetLang,
  sourceDir,
  targetDir,
  segments,
  ...listProps
}: ParallelTextProps) {
  return (
    <MultilingualText
      {...listProps}
      columns={[
        {
          id: "source",
          label: sourceLabel,
          lang: sourceLang,
          dir: sourceDir,
        },
        {
          id: "target",
          label: targetLabel,
          lang: targetLang,
          dir: targetDir,
        },
      ]}
      segments={segments.map((segment) => ({
        id: segment.id,
        cells: {
          source: segment.source,
          target: segment.target,
        },
      }))}
    />
  );
}
