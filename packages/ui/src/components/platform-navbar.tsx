"use client";

import * as React from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";

import { cn } from "../lib/cn";

export type PlatformNavbarItem = {
  id: string;
  label: React.ReactNode;
  href?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
};

export type PlatformNavbarGroup = {
  id: string;
  label: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  items: PlatformNavbarItem[];
};

export type PlatformNavbarVariant = "mobile" | "web" | "desktop";

export type PlatformNavbarRenderLinkProps = PlatformNavbarItem & {
  className: string;
  children: React.ReactNode;
  "aria-current"?: "page";
  onClick: () => void;
};

type PlatformNavbarProps = Omit<React.ComponentPropsWithoutRef<"nav">, "children"> & {
  brand: React.ReactNode;
  groups: PlatformNavbarGroup[];
  actions?: React.ReactNode;
  variant?: PlatformNavbarVariant;
  activeItemId?: string;
  activeGroupId?: string;
  defaultOpenGroupId?: string | null;
  openGroupId?: string | null;
  onOpenGroupChange?: (groupId: string | null) => void;
  onNavigate?: (item: PlatformNavbarItem, group: PlatformNavbarGroup) => void;
  renderLink?: (props: PlatformNavbarRenderLinkProps) => React.ReactNode;
};

const variantConfig = {
  mobile: {
    nav: "mx-auto w-full max-w-md rounded-[2rem] p-2",
    chrome: "flex-col gap-2",
    brand: "w-full justify-between px-3",
    groups: "grid w-full grid-cols-3 gap-1",
    trigger: "min-h-14 flex-col px-2 py-2 text-xs",
    panel:
      "left-2 right-2 top-[calc(100%+0.5rem)] max-h-[70vh] origin-top overflow-y-auto rounded-[1.75rem] p-2",
    list: "grid gap-2",
  },
  web: {
    nav: "mx-auto w-full max-w-5xl rounded-full p-1.5",
    chrome: "items-center gap-2",
    brand: "min-w-36 px-4",
    groups: "flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto",
    trigger: "h-10 px-4 text-sm",
    panel:
      "left-1/2 top-[calc(100%+0.75rem)] w-[min(58rem,calc(100vw-2rem))] -translate-x-1/2 origin-top rounded-[1.75rem] p-3",
    list: "grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
  },
  desktop: {
    nav: "w-full rounded-lg p-1.5",
    chrome: "items-center gap-2",
    brand: "min-w-44 px-3",
    groups: "flex min-w-0 flex-1 items-center gap-1 overflow-x-auto",
    trigger: "h-9 px-3 text-sm",
    panel:
      "right-0 top-[calc(100%+0.6rem)] w-[min(44rem,calc(100vw-2rem))] origin-top-right rounded-xl p-2",
    list: "grid gap-1.5 sm:grid-cols-2",
  },
} satisfies Record<
  PlatformNavbarVariant,
  {
    nav: string;
    chrome: string;
    brand: string;
    groups: string;
    trigger: string;
    panel: string;
    list: string;
  }
>;

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    >
      <path d="M4 6 8 10l4-4" />
    </svg>
  );
}

function DefaultLink({
  href,
  disabled,
  className,
  children,
  onClick,
  ...props
}: PlatformNavbarRenderLinkProps) {
  if (disabled || !href) {
    return (
      <button
        type="button"
        className={className}
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
        aria-current={props["aria-current"]}
      >
        {children}
      </button>
    );
  }

  return (
    <a href={href} className={className} onClick={onClick} aria-current={props["aria-current"]}>
      {children}
    </a>
  );
}

function getInitialOpenGroupId(
  groups: PlatformNavbarGroup[],
  activeGroupId?: string,
  activeItemId?: string,
  defaultOpenGroupId?: string | null,
) {
  if (defaultOpenGroupId !== undefined) {
    return defaultOpenGroupId;
  }

  if (activeGroupId && groups.some((group) => group.id === activeGroupId)) {
    return activeGroupId;
  }

  const activeGroup = groups.find((group) =>
    group.items.some((item) => item.id === activeItemId || item.active),
  );

  return activeGroup?.id ?? null;
}

export function PlatformNavbar({
  brand,
  groups,
  actions,
  variant = "web",
  activeItemId,
  activeGroupId,
  defaultOpenGroupId,
  openGroupId,
  onOpenGroupChange,
  onNavigate,
  renderLink,
  className,
  "aria-label": ariaLabel = "Primary navigation",
  ...props
}: PlatformNavbarProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [uncontrolledOpenGroupId, setUncontrolledOpenGroupId] = React.useState<string | null>(() =>
    getInitialOpenGroupId(groups, activeGroupId, activeItemId, defaultOpenGroupId),
  );
  const config = variantConfig[variant];
  const currentOpenGroupId = openGroupId !== undefined ? openGroupId : uncontrolledOpenGroupId;
  const openGroup =
    groups.find((group) => group.id === currentOpenGroupId && group.items.length > 0) ?? null;

  const resolvedActiveGroupId =
    activeGroupId ??
    groups.find((group) => group.items.some((item) => item.id === activeItemId || item.active))?.id;

  const setOpenGroupId = React.useCallback(
    (groupId: string | null) => {
      if (openGroupId === undefined) {
        setUncontrolledOpenGroupId(groupId);
      }
      onOpenGroupChange?.(groupId);
    },
    [onOpenGroupChange, openGroupId],
  );

  React.useEffect(() => {
    if (!openGroup) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenGroupId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenGroupId(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openGroup, setOpenGroupId]);

  return (
    <LayoutGroup>
      <div
        ref={containerRef}
        className="relative overflow-visible"
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setOpenGroupId(null);
          }
        }}
      >
        <motion.nav
          aria-label={ariaLabel}
          data-slot="platform-navbar"
          data-variant={variant}
          className={cn(
            "relative isolate border border-border/60 bg-background/58 text-foreground shadow-[var(--glass-shadow)] backdrop-blur-2xl supports-backdrop-filter:backdrop-blur-2xl",
            config.nav,
            className,
          )}
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          {...props}
        >
          <div className={cn("flex min-w-0", config.chrome)}>
            <div className={cn("flex min-w-0 items-center gap-2", config.brand)}>
              <div className="min-w-0 truncate text-sm font-semibold">{brand}</div>
              {variant === "mobile" && actions ? <div className="shrink-0">{actions}</div> : null}
            </div>

            <div className={config.groups}>
              {groups.map((group) => {
                const isOpen = group.id === openGroup?.id;
                const isActive = group.id === resolvedActiveGroupId;

                return (
                  <motion.button
                    key={group.id}
                    type="button"
                    aria-controls={`platform-navbar-submenu-${group.id}`}
                    aria-expanded={isOpen}
                    className={cn(
                      "relative inline-flex min-w-0 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full border text-center font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                      config.trigger,
                      isOpen || isActive
                        ? "border-primary/45 bg-primary text-primary-foreground shadow-[var(--glass-interactive-shadow)]"
                        : "border-border/55 bg-background/42 text-foreground/78 hover:border-border hover:bg-accent/50 hover:text-foreground",
                    )}
                    whileHover={reduceMotion ? undefined : { y: -1 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    onClick={() => setOpenGroupId(isOpen ? null : group.id)}
                  >
                    {isOpen ? (
                      <motion.span
                        layoutId="platform-navbar-active-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-primary"
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      />
                    ) : null}
                    {group.icon ? <span className="shrink-0 text-current">{group.icon}</span> : null}
                    <span className="min-w-0 truncate">{group.label}</span>
                    <ChevronIcon
                      className={cn(
                        "size-3.5 shrink-0 transition-transform duration-200",
                        isOpen ? "rotate-180" : undefined,
                      )}
                    />
                  </motion.button>
                );
              })}
            </div>

            {variant !== "mobile" && actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        </motion.nav>

        <AnimatePresence>
          {openGroup ? (
            <motion.div
              key={openGroup.id}
              id={`platform-navbar-submenu-${openGroup.id}`}
              data-slot="platform-navbar-submenu"
              className={cn(
                "absolute z-50 border border-border/60 bg-popover/72 text-popover-foreground shadow-[var(--glass-shadow)] backdrop-blur-2xl",
                config.panel,
              )}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8, scale: 0.98 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {openGroup.eyebrow || openGroup.description ? (
                <div className="mb-2 px-2 py-1">
                  {openGroup.eyebrow ? (
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      {openGroup.eyebrow}
                    </p>
                  ) : null}
                  {openGroup.description ? (
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {openGroup.description}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className={config.list}>
                {openGroup.items.map((item) => {
                  const isCurrent = item.id === activeItemId || item.active;
                  const itemClassName = cn(
                    "group flex min-h-16 min-w-0 items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
                    isCurrent
                      ? "border-primary/45 bg-primary text-primary-foreground"
                      : "border-border/45 bg-background/42 text-foreground hover:border-border hover:bg-accent/50",
                    item.disabled ? "pointer-events-none opacity-50" : undefined,
                  );
                  const content = (
                    <>
                      {item.icon ? <span className="shrink-0 text-current">{item.icon}</span> : null}
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-medium">{item.label}</span>
                          {item.badge ? (
                            <span className="shrink-0 rounded-full border border-current/20 px-2 py-0.5 text-[0.68rem]">
                              {item.badge}
                            </span>
                          ) : null}
                        </span>
                        {item.description ? (
                          <span
                            className={cn(
                              "mt-1 block text-xs leading-5",
                              isCurrent ? "text-primary-foreground/75" : "text-muted-foreground",
                            )}
                          >
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                      {item.meta ? (
                        <span
                          className={cn(
                            "shrink-0 text-xs",
                            isCurrent ? "text-primary-foreground/75" : "text-muted-foreground",
                          )}
                        >
                          {item.meta}
                        </span>
                      ) : null}
                    </>
                  );
                  const handleItemClick = () => {
                    item.onSelect?.();
                    onNavigate?.(item, openGroup);
                    setOpenGroupId(null);
                  };

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {(renderLink ?? DefaultLink)({
                        ...item,
                        className: itemClassName,
                        children: content,
                        "aria-current": isCurrent ? "page" : undefined,
                        onClick: handleItemClick,
                      })}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
