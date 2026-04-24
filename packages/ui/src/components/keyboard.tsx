import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";

const keyboardVariants = cva(
  "inline-grid w-fit rounded-[calc(var(--radius)+0.5rem)] border border-border/60 bg-card/70 shadow-[var(--glass-shadow)] supports-backdrop-filter:backdrop-blur-xl",
  {
    variants: {
      size: {
        sm: "gap-1.5 p-2",
        default: "gap-2 p-3",
        lg: "gap-2.5 p-4",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const keyboardKeyVariants = cva(
  "relative flex min-w-10 flex-[var(--keyboard-key-span)] overflow-hidden rounded-[calc(var(--radius)+0.125rem)] border border-border/60 bg-background/85 text-foreground shadow-[var(--glass-interactive-shadow)] transition-[transform,background-color,color,border-color,box-shadow,opacity] duration-150 supports-backdrop-filter:backdrop-blur-xl data-[pressed=true]:translate-y-[1px] data-[pressed=true]:border-primary/45 data-[pressed=true]:bg-primary/10 data-[pressed=true]:shadow-[0_8px_18px_-14px_rgb(15_23_42_/_0.48)] data-[disabled=true]:opacity-45",
  {
    variants: {
      size: {
        sm: "min-h-9 min-w-9 px-2 py-1.5 text-[0.7rem]",
        default: "min-h-11 min-w-11 px-2.5 py-2 text-xs",
        lg: "min-h-12 min-w-12 px-3 py-2.5 text-sm",
      },
      tone: {
        default: "",
        muted: "bg-muted/70 text-muted-foreground",
        accent: "border-primary/25 bg-primary/8 text-primary",
        danger: "border-destructive/25 bg-destructive/8 text-destructive",
      },
      align: {
        start: "text-left",
        center: "text-center",
        end: "text-right",
      },
    },
    defaultVariants: {
      size: "default",
      tone: "default",
      align: "center",
    },
  },
);

type KeyboardSize = NonNullable<VariantProps<typeof keyboardVariants>["size"]>;
type KeyboardKeyTone = NonNullable<VariantProps<typeof keyboardKeyVariants>["tone"]>;
type KeyboardKeyAlign = NonNullable<VariantProps<typeof keyboardKeyVariants>["align"]>;

type KeyboardKeyDefinition = {
  id?: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  span?: number;
  tone?: KeyboardKeyTone;
  pressed?: boolean;
  disabled?: boolean;
  align?: KeyboardKeyAlign;
  className?: string;
};

type KeyboardRowDefinition = {
  id?: string;
  keys: readonly KeyboardKeyDefinition[];
  className?: string;
};

type KeyboardContextValue = {
  size: KeyboardSize;
};

const KeyboardContext = React.createContext<KeyboardContextValue>({
  size: "default",
});

type KeyboardProps = React.ComponentProps<"div"> &
  VariantProps<typeof keyboardVariants> & {
    rows?: readonly KeyboardRowDefinition[];
  };

function Keyboard({
  className,
  size,
  rows,
  children,
  ...props
}: KeyboardProps) {
  const resolvedSize = size ?? "default";

  return (
    <KeyboardContext.Provider value={{ size: resolvedSize }}>
      <div
        data-slot="keyboard"
        data-size={resolvedSize}
        className={cn(keyboardVariants({ size: resolvedSize }), className)}
        {...props}
      >
        {rows
          ? rows.map((row, rowIndex) => (
              <KeyboardRow key={row.id ?? rowIndex} className={row.className}>
                {row.keys.map((key, keyIndex) => (
                  <KeyboardKey
                    key={key.id ?? keyIndex}
                    align={key.align}
                    className={key.className}
                    disabled={key.disabled}
                    hint={key.hint}
                    pressed={key.pressed}
                    span={key.span}
                    tone={key.tone}
                  >
                    {key.label}
                  </KeyboardKey>
                ))}
              </KeyboardRow>
            ))
          : children}
      </div>
    </KeyboardContext.Provider>
  );
}

function KeyboardRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="keyboard-row" className={cn("flex items-stretch gap-2", className)} {...props} />
  );
}

type KeyboardKeyProps = React.ComponentProps<"div"> &
  VariantProps<typeof keyboardKeyVariants> & {
    hint?: React.ReactNode;
    span?: number;
    pressed?: boolean;
    disabled?: boolean;
  };

function KeyboardKey({
  className,
  children,
  hint,
  span = 1,
  tone = "default",
  align = "center",
  pressed = false,
  disabled = false,
  style,
  ...props
}: KeyboardKeyProps) {
  const { size } = React.useContext(KeyboardContext);
  const normalizedSpan = Number.isFinite(span) && span > 0 ? span : 1;
  const keyboardKeyStyle = {
    ...style,
    "--keyboard-key-span": String(normalizedSpan),
  } as React.CSSProperties;
  const isCentered = align === "center";

  return (
    <div
      data-slot="keyboard-key"
      data-align={align}
      data-disabled={disabled ? true : undefined}
      data-pressed={pressed ? true : undefined}
      data-tone={tone}
      className={cn(keyboardKeyVariants({ align, size, tone }), className)}
      style={keyboardKeyStyle}
      {...props}
    >
      <div
        className={cn(
          "flex h-full w-full flex-col gap-1",
          hint ? "justify-between" : "justify-center",
          align === "start" && "items-start",
          isCentered && "items-center",
          align === "end" && "items-end",
        )}
      >
        {hint ? (
          <span
            data-slot="keyboard-key-hint"
            className={cn(
              "text-[0.7em] font-medium tracking-[0.16em] text-muted-foreground uppercase",
              align === "start" && "self-start",
              isCentered && "self-end",
              align === "end" && "self-end",
            )}
          >
            {hint}
          </span>
        ) : null}
        <span
          data-slot="keyboard-key-label"
          className={cn("w-full truncate font-medium leading-none", isCentered && "text-center")}
        >
          {children}
        </span>
      </div>
    </div>
  );
}

export { Keyboard, KeyboardKey, KeyboardRow };
export type {
  KeyboardKeyAlign,
  KeyboardKeyDefinition,
  KeyboardKeyProps,
  KeyboardKeyTone,
  KeyboardProps,
  KeyboardRowDefinition,
  KeyboardSize,
};
