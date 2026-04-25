import * as React from "react";

import { PageContent, SectionGrid } from "@moritzbrantner/ui";

import {
  FrontendScreenHeader,
  FrontendScreenSections,
  type FrontendScreenBaseProps,
} from "./shared";

export type WorkbenchScreenProps = FrontendScreenBaseProps;

export function WorkbenchScreen({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryActions,
  toolbar,
  sections,
  sidebar,
  emptyState,
}: WorkbenchScreenProps) {
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
        <SectionGrid columns={sidebar ? "sidebar-right" : "one"}>
          <FrontendScreenSections sections={sections} emptyState={emptyState} />
          {sidebar}
        </SectionGrid>
      </PageContent>
    </>
  );
}
