"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "../lib/cn";
import { Button } from "./button";

function MobileSlide({
  direction = "bottom",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="mobile-slide" direction={direction} {...props} />;
}

function MobileSlideTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="mobile-slide-trigger" {...props} />;
}

function MobileSlidePortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="mobile-slide-portal" {...props} />;
}

function MobileSlideClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="mobile-slide-close" {...props} />;
}

function MobileSlideOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="mobile-slide-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

function MobileSlideContent({
  className,
  children,
  showHandle = true,
  showCloseButton = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  showHandle?: boolean;
  showCloseButton?: boolean;
}) {
  return (
    <MobileSlidePortal>
      <MobileSlideOverlay />
      <DrawerPrimitive.Content
        data-slot="mobile-slide-content"
        className={cn(
          "group/mobile-slide-content fixed z-50 flex flex-col overflow-hidden border-border bg-popover text-sm text-popover-foreground shadow-lg outline-none data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:max-h-[88dvh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-[min(90vw,24rem)] data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-[min(90vw,24rem)] data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:max-h-[88dvh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
          className,
        )}
        {...props}
      >
        {showHandle && (
          <div
            data-slot="mobile-slide-handle"
            className="mx-auto mt-3 h-1 w-12 shrink-0 rounded-full bg-muted-foreground/35 group-data-[vaul-drawer-direction=left]/mobile-slide-content:hidden group-data-[vaul-drawer-direction=right]/mobile-slide-content:hidden"
          />
        )}
        {children}
        {showCloseButton && (
          <DrawerPrimitive.Close data-slot="mobile-slide-close" asChild>
            <Button variant="ghost" size="icon-sm" className="absolute top-3 right-3">
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </DrawerPrimitive.Close>
        )}
      </DrawerPrimitive.Content>
    </MobileSlidePortal>
  );
}

function MobileSlideHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="mobile-slide-header"
      className={cn("grid gap-1 px-4 pt-4 pb-3", className)}
      {...props}
    />
  );
}

function MobileSlideTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="mobile-slide-title"
      className={cn("font-heading text-base font-medium leading-snug text-foreground", className)}
      {...props}
    />
  );
}

function MobileSlideDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="mobile-slide-description"
      className={cn("text-sm leading-normal text-muted-foreground", className)}
      {...props}
    />
  );
}

function MobileSlideBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="mobile-slide-body"
      className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-3", className)}
      {...props}
    />
  );
}

function MobileSlideFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="mobile-slide-footer"
      className={cn(
        "mt-auto grid gap-2 border-t border-border/60 bg-muted/35 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]",
        className,
      )}
      {...props}
    />
  );
}

export {
  MobileSlide,
  MobileSlideBody,
  MobileSlideClose,
  MobileSlideContent,
  MobileSlideDescription,
  MobileSlideFooter,
  MobileSlideHeader,
  MobileSlideOverlay,
  MobileSlidePortal,
  MobileSlideTitle,
  MobileSlideTrigger,
};
