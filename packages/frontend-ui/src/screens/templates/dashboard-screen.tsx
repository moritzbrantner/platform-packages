import * as React from "react";

import { PageContent, SectionGrid } from "@moritzbrantner/ui";

import {
  FrontendScreenHeader,
  FrontendScreenSections,
  type FrontendScreenBaseProps,
} from "./shared";

export type DashboardScreenProps = FrontendScreenBaseProps & {
  summary?: React.ReactNode;
};

export function DashboardScreen({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryActions,
  toolbar,
  sections,
  sidebar,
  summary,
  emptyState,
}: DashboardScreenProps) {
  return (
    <>
      <FrontendScreenHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      />
      <PageContent>
        {toolbar}
        {summary}
        {sidebar ? (
          <SectionGrid columns="sidebar-right">
            <FrontendScreenSections sections={sections} emptyState={emptyState} />
            {sidebar}
          </SectionGrid>
        ) : (
          <FrontendScreenSections sections={sections} emptyState={emptyState} />
        )}
      </PageContent>
    </>
  );
}
