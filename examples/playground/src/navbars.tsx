import { useMemo, useState, type SVGProps } from "react";

import {
  Badge,
  Button,
  PlatformNavbar,
  type PlatformNavbarGroup,
  type PlatformNavbarItem,
  type PlatformNavbarRenderLinkProps,
  type PlatformNavbarVariant,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

function ArchiveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M4 6.5h16v3H4z" />
      <path d="M6 9.5V19h12V9.5" />
      <path d="M9 13h6" />
    </svg>
  );
}

function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0v4l1.7 2H4.8l1.7-2v-4Z" />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

function CompassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" />
    </svg>
  );
}

function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </svg>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
      <path d="m18.3 13.2.1-1.2-.1-1.2 2-1.5-2-3.4-2.4 1a8 8 0 0 0-2-1.2L13.6 3h-4l-.4 2.7a8 8 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.5-.1 1.2.1 1.2-2 1.5 2 3.4 2.4-1a8 8 0 0 0 2 1.2l.4 2.7h4l.4-2.7a8 8 0 0 0 2-1.2l2.4 1 2-3.4-2.1-1.5Z" />
    </svg>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <circle cx="11" cy="11" r="5.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

const baseGroups = [
  {
    id: "discover",
    label: "Discover",
    eyebrow: "Public",
    description: "Landing pages, stories, and public references.",
    icon: <CompassIcon className="size-4" />,
    items: [
      {
        id: "overview",
        label: "Overview",
        href: "#overview",
        description: "Project status, releases, and reusable package entry points.",
        meta: "A",
      },
      {
        id: "story",
        label: "Story Demo",
        href: "#story",
        description: "Scene-based narrative components for launch pages.",
        badge: "New",
        meta: "S",
      },
      {
        id: "about",
        label: "About",
        href: "#about",
        description: "Reusable public route for future project shells.",
        meta: "I",
      },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    eyebrow: "Signed in",
    description: "Operational routes with denser navigation targets.",
    icon: <GridIcon className="size-4" />,
    items: [
      {
        id: "people",
        label: "People",
        href: "#people",
        description: "Profile search, following state, and role previews.",
        icon: <UserIcon className="size-4" />,
        meta: "P",
      },
      {
        id: "notifications",
        label: "Notifications",
        href: "#notifications",
        description: "Unread summaries and action-required events.",
        icon: <BellIcon className="size-4" />,
        badge: "8",
        meta: "N",
      },
      {
        id: "documents",
        label: "Documents",
        href: "#documents",
        description: "Recent files, drafts, and desktop handoff targets.",
        icon: <ArchiveIcon className="size-4" />,
        meta: "D",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    eyebrow: "Admin",
    description: "Settings, reports, and package governance.",
    icon: <SettingsIcon className="size-4" />,
    items: [
      {
        id: "settings",
        label: "Settings",
        href: "#settings",
        description: "Preferences, theme state, and account controls.",
        meta: ",",
      },
      {
        id: "reports",
        label: "Reports",
        href: "#reports",
        description: "Analytics, navigation journeys, and health checks.",
        badge: "Pro",
        meta: "R",
      },
      {
        id: "packages",
        label: "Packages",
        href: "#packages",
        description: "Promotion candidates for the platform package repository.",
        meta: "K",
      },
    ],
  },
] as const satisfies PlatformNavbarGroup[];

const variantCopy = {
  mobile: {
    title: "Mobile",
    brand: "Mobile App",
    active: "notifications",
    open: "workspace",
    shell: "mx-auto max-w-md",
  },
  web: {
    title: "Web",
    brand: "Web Showcase",
    active: "story",
    open: "discover",
    shell: "mx-auto max-w-5xl",
  },
  desktop: {
    title: "Desktop",
    brand: "Desktop Studio",
    active: "documents",
    open: "workspace",
    shell: "mx-auto max-w-4xl",
  },
} satisfies Record<
  PlatformNavbarVariant,
  {
    title: string;
    brand: string;
    active: string;
    open: string;
    shell: string;
  }
>;

function DemoLink({
  href,
  className,
  children,
  onClick,
  "aria-current": ariaCurrent,
}: PlatformNavbarRenderLinkProps) {
  return (
    <a
      href={href ?? "#"}
      className={className}
      aria-current={ariaCurrent}
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {children}
    </a>
  );
}

function NavbarVariantPreview({ variant }: { variant: PlatformNavbarVariant }) {
  const config = variantCopy[variant];
  const [activeItemId, setActiveItemId] = useState(config.active);
  const [lastSelection, setLastSelection] = useState(config.active);
  const groups = useMemo(
    () =>
      baseGroups.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          active: item.id === activeItemId,
        })),
      })),
    [activeItemId],
  );
  const selectedItem = groups
    .flatMap((group) => group.items)
    .find((item) => item.id === activeItemId);

  return (
    <section className="rounded-none border border-border/60 bg-background/48 p-4 shadow-2xl shadow-black/10 supports-backdrop-filter:backdrop-blur-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="outline">{config.title}</Badge>
          <h2 className="mt-2 text-xl font-semibold">{config.title} navbar</h2>
        </div>
        <p className="text-sm text-muted-foreground">{selectedItem?.label ?? lastSelection}</p>
      </div>

      <div className={config.shell}>
        <PlatformNavbar
          aria-label={`${config.title} testcase navigation`}
          brand={config.brand}
          groups={groups}
          variant={variant}
          activeItemId={activeItemId}
          defaultOpenGroupId={config.open}
          renderLink={DemoLink}
          actions={
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon-sm" aria-label="Search">
                <SearchIcon className="size-4" />
              </Button>
              <Button type="button" variant="secondary" size="sm">
                Sync
              </Button>
            </div>
          }
          onNavigate={(item: PlatformNavbarItem) => {
            setActiveItemId(item.id);
            setLastSelection(String(item.label));
          }}
        />
      </div>
    </section>
  );
}

function NavbarsPage() {
  return (
    <PlaygroundPage
      activePage="navbars"
      title="Navbar testcase"
      description="Mobile, web, and desktop navbar variants share one typed component with animated glass submenus from the UI package."
    >
      <div className="grid gap-5">
        <NavbarVariantPreview variant="mobile" />
        <NavbarVariantPreview variant="web" />
        <NavbarVariantPreview variant="desktop" />
      </div>
    </PlaygroundPage>
  );
}

mountPage(<NavbarsPage />);
