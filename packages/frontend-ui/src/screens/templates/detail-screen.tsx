import * as React from "react";

import { PageContent, SectionGrid } from "@moritzbrantner/ui";

import {
  FrontendScreenHeader,
  FrontendScreenSections,
  type FrontendScreenBaseProps,
} from "./shared";

export type DetailScreenProps = FrontendScreenBaseProps;

export function DetailScreen({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryActions,
  sections,
  sidebar,
  emptyState,
}: DetailScreenProps) {
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
        <SectionGrid columns={sidebar ? "sidebar-right" : "one"}>
          <FrontendScreenSections sections={sections} emptyState={emptyState} />
          {sidebar}
        </SectionGrid>
      </PageContent>
    </>
  );
}
