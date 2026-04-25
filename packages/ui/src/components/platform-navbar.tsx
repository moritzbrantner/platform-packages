"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";

import { cn } from "../lib/cn";
import { AccountMenu, type AccountMenuProps } from "./account-menu";
import { LanguageSwitcher, type LanguageSwitcherProps } from "./language-switcher";
import { NotificationMenu, type NotificationMenuProps } from "./notification-menu";
import { ThemeModeSwitch, type ThemeModeSwitchProps } from "./theme-mode-switch";

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
  accountMenu?: AccountMenuProps;
  notificationMenu?: NotificationMenuProps;
  languageSwitcher?: LanguageSwitcherProps | boolean;
  themeModeSwitch?: ThemeModeSwitchProps | boolean;
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
    nav: "mx-auto w-full max-w-md rounded-xl p-2",
    chrome: "flex-col gap-2",
    brand: "w-full justify-between px-3",
    groups: "grid w-full grid-cols-3 gap-1",
    trigger: "min-h-14 flex-col px-2 py-2 text-xs",
    panel: "origin-top overflow-y-auto rounded-xl p-2",
    list: "grid gap-2",
  },
  web: {
    nav: "mx-auto w-full max-w-5xl rounded-xl p-1.5",
    chrome: "items-center gap-2",
    brand: "min-w-36 px-4",
    groups: "flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto",
    trigger: "h-10 px-4 text-sm",
    panel: "origin-top rounded-xl p-3",
    list: "grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
  },
  desktop: {
    nav: "w-full rounded-lg p-1.5",
    chrome: "items-center gap-2",
    brand: "min-w-44 px-3",
    groups: "flex min-w-0 flex-1 items-center gap-1 overflow-x-auto",
    trigger: "h-9 px-3 text-sm",
    panel: "origin-top rounded-xl p-2",
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

const submenuSizeConfig = {
  mobile: { gap: 8, margin: 8, maxWidth: 28 * 16 },
  web: { gap: 12, margin: 16, maxWidth: 58 * 16 },
  desktop: { gap: 10, margin: 16, maxWidth: 44 * 16 },
} satisfies Record<PlatformNavbarVariant, { gap: number; margin: number; maxWidth: number }>;

const platformNavbarOpenEvent = "platform-navbar:open";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

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
  accountMenu,
  notificationMenu,
  languageSwitcher,
  themeModeSwitch,
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
  const instanceId = React.useId();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const navRef = React.useRef<HTMLElement>(null);
  const submenuRef = React.useRef<HTMLDivElement>(null);
  const triggerRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);
  const [submenuStyle, setSubmenuStyle] = React.useState<React.CSSProperties>();
  const [uncontrolledOpenGroupId, setUncontrolledOpenGroupId] = React.useState<string | null>(() =>
    getInitialOpenGroupId(groups, activeGroupId, activeItemId, defaultOpenGroupId),
  );
  const config = variantConfig[variant];
  const currentOpenGroupId = openGroupId !== undefined ? openGroupId : uncontrolledOpenGroupId;
  const openGroup =
    groups.find((group) => group.id === currentOpenGroupId && group.items.length > 0) ?? null;
  const hasActions = Boolean(
    actions || accountMenu || notificationMenu || languageSwitcher || themeModeSwitch,
  );

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

  const getSubmenuId = React.useCallback(
    (groupId: string) => `platform-navbar-${instanceId}-submenu-${groupId}`,
    [instanceId],
  );

  const containsNavbarTarget = React.useCallback((target: EventTarget | null) => {
    if (!(target instanceof Node)) {
      return false;
    }

    return Boolean(containerRef.current?.contains(target) || submenuRef.current?.contains(target));
  }, []);

  const handleBlurCapture = React.useCallback(
    (event: React.FocusEvent) => {
      if (!containsNavbarTarget(event.relatedTarget)) {
        setOpenGroupId(null);
      }
    },
    [containsNavbarTarget, setOpenGroupId],
  );

  const updateSubmenuPosition = React.useCallback(() => {
    if (!openGroup || typeof window === "undefined") {
      setSubmenuStyle(undefined);
      return;
    }

    const container = containerRef.current;
    const trigger = triggerRefs.current.get(openGroup.id);

    if (!container) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const navRect = navRef.current?.getBoundingClientRect() ?? containerRect;
    const triggerRect = trigger?.getBoundingClientRect();
    const submenuRect = submenuRef.current?.getBoundingClientRect();
    const { gap, margin, maxWidth } = submenuSizeConfig[variant];
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const availableWidth = Math.max(0, viewportWidth - margin * 2);
    const anchorRect = variant === "mobile" ? navRect : containerRect;
    const anchorWidth = anchorRect.width || availableWidth;
    const preferredMobileWidth = Math.min(anchorWidth - margin * 2, maxWidth);
    const width =
      variant === "mobile"
        ? Math.min(Math.max(preferredMobileWidth, 0), availableWidth)
        : Math.min(maxWidth, availableWidth);
    const triggerCenter =
      triggerRect && triggerRect.width > 0
        ? triggerRect.left + triggerRect.width / 2
        : anchorRect.left + anchorWidth / 2;
    const rawLeft = variant === "mobile" ? anchorRect.left + margin : triggerCenter - width / 2;
    const left = clamp(rawLeft, margin, viewportWidth - width - margin);
    const verticalAnchorRect = navRect;
    const belowTop = verticalAnchorRect.bottom + gap;
    const availableBelow = viewportHeight - belowTop - margin;
    const aboveBottom = verticalAnchorRect.top - gap;
    const availableAbove = aboveBottom - margin;
    const measuredHeight = submenuRect?.height ?? 0;
    const preferredHeight = Math.max(measuredHeight, 160);
    const shouldOpenAbove = availableBelow < 160 && availableAbove > availableBelow;
    const maxHeight = Math.max(160, shouldOpenAbove ? availableAbove : availableBelow);
    const top = shouldOpenAbove
      ? Math.max(margin, aboveBottom - Math.min(preferredHeight, maxHeight))
      : belowTop;

    setSubmenuStyle({
      left,
      maxHeight,
      top,
      transformOrigin: shouldOpenAbove ? "bottom center" : "top center",
      width,
    });
  }, [openGroup, variant]);

  React.useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  React.useEffect(() => {
    function handleNavbarOpen(event: Event) {
      const openedInstanceId = (event as CustomEvent<{ instanceId?: string }>).detail?.instanceId;

      if (openedInstanceId && openedInstanceId !== instanceId) {
        setOpenGroupId(null);
      }
    }

    window.addEventListener(platformNavbarOpenEvent, handleNavbarOpen);

    return () => {
      window.removeEventListener(platformNavbarOpenEvent, handleNavbarOpen);
    };
  }, [instanceId, setOpenGroupId]);

  React.useEffect(() => {
    if (!openGroup) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(platformNavbarOpenEvent, {
        detail: { instanceId },
      }),
    );
  }, [instanceId, openGroup]);

  React.useLayoutEffect(() => {
    if (!openGroup) {
      setSubmenuStyle(undefined);
      return;
    }

    updateSubmenuPosition();
    const frame = window.requestAnimationFrame(updateSubmenuPosition);

    window.addEventListener("resize", updateSubmenuPosition);
    window.addEventListener("scroll", updateSubmenuPosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateSubmenuPosition);
      window.removeEventListener("scroll", updateSubmenuPosition, true);
    };
  }, [openGroup, portalContainer, updateSubmenuPosition]);

  React.useEffect(() => {
    if (!openGroup) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containsNavbarTarget(event.target)) {
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
  }, [containsNavbarTarget, openGroup, setOpenGroupId]);

  const submenu = (
    <AnimatePresence>
      {openGroup ? (
        <motion.div
          key={openGroup.id}
          ref={submenuRef}
          id={getSubmenuId(openGroup.id)}
          data-slot="platform-navbar-submenu"
          className={cn(
            "fixed z-[100] overflow-hidden border border-border/60 bg-popover/74 text-popover-foreground shadow-[var(--glass-shadow)] backdrop-blur-2xl",
            config.panel,
          )}
          style={submenuStyle}
          onBlurCapture={handleBlurCapture}
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
                  : "border-border/45 bg-background/36 text-foreground hover:border-border hover:bg-accent/45",
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
  );
  const renderedActions = hasActions ? (
    <div
      data-slot="platform-navbar-actions"
      className="flex shrink-0 items-center justify-end gap-2"
    >
      {actions}
      {languageSwitcher ? (
        <LanguageSwitcher {...(languageSwitcher === true ? {} : languageSwitcher)} />
      ) : null}
      {themeModeSwitch ? (
        <ThemeModeSwitch {...(themeModeSwitch === true ? {} : themeModeSwitch)} />
      ) : null}
      {notificationMenu ? <NotificationMenu {...notificationMenu} /> : null}
      {accountMenu ? <AccountMenu {...accountMenu} /> : null}
    </div>
  ) : null;

  return (
    <LayoutGroup>
      <div
        ref={containerRef}
        className="relative overflow-visible"
        onBlurCapture={handleBlurCapture}
      >
        <nav
          ref={navRef}
          aria-label={ariaLabel}
          data-slot="platform-navbar"
          data-variant={variant}
          className={cn(
            "relative isolate overflow-hidden border border-border/60 bg-card/70 text-foreground shadow-[var(--glass-shadow)] backdrop-blur-2xl supports-backdrop-filter:backdrop-blur-2xl",
            config.nav,
            className,
          )}
          {...props}
        >
          <motion.div
            className={cn("flex min-w-0", config.chrome)}
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={cn("flex min-w-0 items-center gap-2", config.brand)}>
              <div className="min-w-0 truncate text-sm font-semibold">{brand}</div>
              {variant === "mobile" ? renderedActions : null}
            </div>

            <div className={config.groups}>
              {groups.map((group) => {
                const isOpen = group.id === openGroup?.id;
                const isActive = group.id === resolvedActiveGroupId;

                return (
                  <motion.button
                    key={group.id}
                    ref={(node) => {
                      if (node) {
                        triggerRefs.current.set(group.id, node);
                      } else {
                        triggerRefs.current.delete(group.id);
                      }
                    }}
                    type="button"
                    aria-controls={getSubmenuId(group.id)}
                    aria-expanded={isOpen}
                    className={cn(
                      "relative inline-flex min-w-0 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-md border text-center font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                      config.trigger,
                      isOpen || isActive
                        ? "border-primary/45 bg-primary text-primary-foreground shadow-[var(--glass-interactive-shadow)]"
                        : "border-border/55 bg-background/36 text-foreground/78 hover:border-border hover:bg-accent/45 hover:text-foreground",
                    )}
                    whileHover={reduceMotion ? undefined : { y: -1 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    onClick={() => setOpenGroupId(isOpen ? null : group.id)}
                  >
                    {isOpen ? (
                      <motion.span
                        layoutId="platform-navbar-active-pill"
                        className="absolute inset-0 -z-10 rounded-md bg-primary"
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      />
                    ) : null}
                    {group.icon ? (
                      <span className="shrink-0 text-current">{group.icon}</span>
                    ) : null}
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

            {variant !== "mobile" ? renderedActions : null}
          </motion.div>
        </nav>
      </div>
      {portalContainer ? createPortal(submenu, portalContainer) : submenu}
    </LayoutGroup>
  );
}
