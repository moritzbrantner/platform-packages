import * as React from "react";

import { PageContent, SectionGrid } from "@moritzbrantner/ui";

import {
  FrontendScreenHeader,
  FrontendScreenSections,
  type FrontendScreenBaseProps,
} from "./shared";

export type PublicScreenProps = FrontendScreenBaseProps;

export function PublicScreen({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryActions,
  sections,
  sidebar,
  emptyState,
}: PublicScreenProps) {
  return (
    <>
      <FrontendScreenHeader
        align="center"
        eyebrow={eyebrow}
        title={title}
        description={description}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      />
      <PageContent>
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
