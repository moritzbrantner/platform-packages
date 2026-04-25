import * as React from "react";

import {
  PageActions,
  PageDescription,
  PageHeader,
  PageTitle,
  Surface,
  SurfaceContent,
  SurfaceDescription,
  SurfaceFooter,
  SurfaceHeader,
  SurfaceTitle,
  cn,
} from "@moritzbrantner/ui";

export type FrontendScreenSection = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  content: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "muted" | "transparent";
  className?: string;
};

export type FrontendScreenBaseProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  toolbar?: React.ReactNode;
  sections?: readonly FrontendScreenSection[];
  sidebar?: React.ReactNode;
  emptyState?: React.ReactNode;
};

export function FrontendScreenHeader({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryActions,
  align = "start",
}: Pick<
  FrontendScreenBaseProps,
  "eyebrow" | "title" | "description" | "primaryAction" | "secondaryActions"
> & {
  align?: "start" | "center";
}) {
  const hasActions = primaryAction || secondaryActions;

  return (
    <PageHeader align={align}>
      {eyebrow ? <div className="w-fit">{eyebrow}</div> : null}
      <PageTitle>{title}</PageTitle>
      {description ? <PageDescription>{description}</PageDescription> : null}
      {hasActions ? (
        <PageActions>
          {secondaryActions}
          {primaryAction}
        </PageActions>
      ) : null}
    </PageHeader>
  );
}

export function FrontendScreenSections({
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
    <div className={cn("grid gap-4", className)}>
      {sections.map((section) => (
        <Surface
          key={section.id}
          variant={section.variant ?? "default"}
          className={cn(section.className)}
        >
          {section.title || section.description ? (
            <SurfaceHeader>
              {section.title ? <SurfaceTitle>{section.title}</SurfaceTitle> : null}
              {section.description ? (
                <SurfaceDescription>{section.description}</SurfaceDescription>
              ) : null}
            </SurfaceHeader>
          ) : null}
          <SurfaceContent className={section.title || section.description ? "mt-4" : undefined}>
            {section.content}
          </SurfaceContent>
          {section.footer ? <SurfaceFooter>{section.footer}</SurfaceFooter> : null}
        </Surface>
      ))}
    </div>
  );
}
