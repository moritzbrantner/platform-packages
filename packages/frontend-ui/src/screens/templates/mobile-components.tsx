import * as React from "react";

import {
  MobileSlide,
  MobileSlideBody,
  MobileSlideClose,
  MobileSlideContent,
  MobileSlideDescription,
  MobileSlideFooter,
  MobileSlideHeader,
  MobileSlideTitle,
  MobileSlideTrigger,
  cn,
} from "@moritzbrantner/ui";

import { MobileActionDock } from "./mobile-screen";

export type MobileToolbarProps = React.ComponentProps<"div"> & {
  label?: string;
};

export function MobileToolbar({
  children,
  className,
  label = "Mobile toolbar",
  ...props
}: MobileToolbarProps) {
  return (
    <div
      data-slot="mobile-toolbar"
      role="toolbar"
      aria-label={label}
      className={cn("overflow-x-auto px-4 pb-2", className)}
      {...props}
    >
      <div className="flex min-w-max items-center gap-2">{children}</div>
    </div>
  );
}

export type MobileOverflowPanelProps = {
  trigger: React.ReactElement;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  direction?: "top" | "right" | "bottom" | "left";
  className?: string;
  contentClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  showCloseButton?: boolean;
};

export function MobileOverflowPanel({
  trigger,
  title,
  description,
  children,
  footer,
  direction = "bottom",
  className,
  contentClassName,
  bodyClassName,
  footerClassName,
  showCloseButton = true,
}: MobileOverflowPanelProps) {
  return (
    <div data-slot="mobile-overflow-panel" className={className}>
      <MobileSlide direction={direction}>
        <MobileSlideTrigger asChild>{trigger}</MobileSlideTrigger>
        <MobileSlideContent showCloseButton={showCloseButton} className={contentClassName}>
          <MobileSlideHeader>
            <MobileSlideTitle>{title}</MobileSlideTitle>
            {description ? <MobileSlideDescription>{description}</MobileSlideDescription> : null}
          </MobileSlideHeader>
          <MobileSlideBody className={bodyClassName}>{children}</MobileSlideBody>
          {footer ? (
            <MobileSlideFooter className={footerClassName}>{footer}</MobileSlideFooter>
          ) : null}
        </MobileSlideContent>
      </MobileSlide>
    </div>
  );
}

export type MobileCompanionPanelProps = Omit<MobileOverflowPanelProps, "children"> & {
  companion: React.ReactNode;
};

export function MobileCompanionPanel({ companion, ...props }: MobileCompanionPanelProps) {
  return (
    <MobileOverflowPanel {...props}>
      <div data-slot="mobile-companion-panel">{companion}</div>
    </MobileOverflowPanel>
  );
}

export type MobileStickyFooterProps = {
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  layout?: "inline" | "stacked";
};

export function MobileStickyFooter({
  primaryAction,
  secondaryActions,
  children,
  className,
  layout = "inline",
}: MobileStickyFooterProps) {
  const hasContent = Boolean(children || secondaryActions || primaryAction);

  if (!hasContent) {
    return null;
  }

  return (
    <MobileActionDock className={className} layout={layout}>
      {children ?? (
        <>
          {secondaryActions}
          {primaryAction}
        </>
      )}
    </MobileActionDock>
  );
}
