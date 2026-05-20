import * as React from "react";

import {
  PageDescription,
  PageTitle,
  Surface,
  SurfaceContent,
  SurfaceDescription,
  SurfaceFooter,
  SurfaceHeader,
  SurfaceTitle,
  cn,
} from "@moritzbrantner/ui";

import type { FrontendScreenBaseProps, FrontendScreenSection } from "./shared";

export type MobileScreenBaseProps = Omit<FrontendScreenBaseProps, "sidebar" | "toolbar"> & {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  navigation?: React.ReactNode;
  summary?: React.ReactNode;
  companion?: React.ReactNode;
  bottomActions?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export type MobileDashboardScreenProps = MobileScreenBaseProps;
export type MobileDetailScreenProps = MobileScreenBaseProps;
export type MobileFormScreenProps = Omit<MobileScreenBaseProps, "companion">;
export type MobileWorkbenchScreenProps = MobileScreenBaseProps & {
  composer?: React.ReactNode;
};

export function MobileScreenShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background text-foreground",
        "pt-[max(env(safe-area-inset-top),0.75rem)]",
        "pb-[max(env(safe-area-inset-bottom),0.75rem)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MobileScreenHeader({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryActions,
  leading,
  trailing,
}: Pick<
  MobileScreenBaseProps,
  | "eyebrow"
  | "title"
  | "description"
  | "primaryAction"
  | "secondaryActions"
  | "leading"
  | "trailing"
>) {
  const hasTopBar = leading || trailing || eyebrow;
  const actions = (
    <>
      {secondaryActions}
      {primaryAction}
    </>
  );

  return (
    <header className="grid gap-3 px-4 pb-3">
      {hasTopBar ? (
        <div className="flex min-h-9 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {leading}
            {eyebrow ? (
              <div className="min-w-0 truncate text-xs font-medium uppercase text-muted-foreground">
                {eyebrow}
              </div>
            ) : null}
          </div>
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
      ) : null}
      <div className="grid gap-1">
        <PageTitle className="text-balance text-2xl tracking-normal md:text-2xl">{title}</PageTitle>
        {description ? (
          <PageDescription className="text-sm leading-6">{description}</PageDescription>
        ) : null}
      </div>
      {primaryAction || secondaryActions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function MobileScreenSections({
  sections = [],
  emptyState,
  className,
}: {
  sections?: readonly FrontendScreenSection[];
  emptyState?: React.ReactNode;
  className?: string;
}) {
  if (sections.length === 0) {
    return emptyState ? <div className={className}>{emptyState}</div> : null;
  }

  return (
    <div className={cn("grid gap-3", className)}>
      {sections.map((section) => (
        <Surface
          key={section.id}
          variant={section.variant ?? "default"}
          className={cn("rounded-none border-x-0 sm:rounded-lg sm:border-x", section.className)}
        >
          {section.title || section.description ? (
            <SurfaceHeader>
              {section.title ? <SurfaceTitle>{section.title}</SurfaceTitle> : null}
              {section.description ? (
                <SurfaceDescription>{section.description}</SurfaceDescription>
              ) : null}
            </SurfaceHeader>
          ) : null}
          <SurfaceContent className={section.title || section.description ? "mt-3" : undefined}>
            {section.content}
          </SurfaceContent>
          {section.footer ? <SurfaceFooter>{section.footer}</SurfaceFooter> : null}
        </Surface>
      ))}
    </div>
  );
}

export function MobileActionDock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 mt-auto border-t bg-background/95 px-4 py-3 backdrop-blur",
        "pb-[max(env(safe-area-inset-bottom),0.75rem)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function MobileDashboardScreen(props: MobileDashboardScreenProps) {
  return <MobileScreenTemplate {...props} contentClassName={cn("gap-4", props.contentClassName)} />;
}

export function MobileDetailScreen(props: MobileDetailScreenProps) {
  return <MobileScreenTemplate {...props} />;
}

export function MobileFormScreen({ contentClassName, ...props }: MobileFormScreenProps) {
  return (
    <MobileScreenTemplate
      {...props}
      contentClassName={cn("mx-auto w-full max-w-sm", contentClassName)}
    />
  );
}

export function MobileWorkbenchScreen({
  composer,
  bottomActions,
  contentClassName,
  ...props
}: MobileWorkbenchScreenProps) {
  return (
    <MobileScreenTemplate
      {...props}
      contentClassName={cn("flex-1", contentClassName)}
      bottomActions={bottomActions ?? composer}
    />
  );
}

function MobileScreenTemplate({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryActions,
  sections,
  emptyState,
  leading,
  trailing,
  navigation,
  summary,
  companion,
  bottomActions,
  footer,
  className,
  contentClassName,
}: MobileScreenBaseProps) {
  return (
    <MobileScreenShell className={className}>
      <MobileScreenHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
        leading={leading}
        trailing={trailing}
      />
      {navigation ? <div className="px-4 pb-3">{navigation}</div> : null}
      <main className={cn("grid min-h-0 gap-3 px-0 pb-4", contentClassName)}>
        {summary ? <div className="px-4">{summary}</div> : null}
        <MobileScreenSections sections={sections} emptyState={emptyState} />
        {companion ? <div className="px-4">{companion}</div> : null}
      </main>
      {footer ? <footer className="px-4 pb-3">{footer}</footer> : null}
      {bottomActions ? <MobileActionDock>{bottomActions}</MobileActionDock> : null}
    </MobileScreenShell>
  );
}
