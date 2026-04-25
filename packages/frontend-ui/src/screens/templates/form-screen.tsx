import * as React from "react";

import { PageContent, SectionGrid } from "@moritzbrantner/ui";

import {
  FrontendScreenHeader,
  FrontendScreenSections,
  type FrontendScreenBaseProps,
} from "./shared";

export type FormScreenProps = FrontendScreenBaseProps;

export function FormScreen({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryActions,
  sections,
  sidebar,
  emptyState,
}: FormScreenProps) {
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
      <PageContent className="gap-4">
        {sidebar ? (
          <SectionGrid columns="sidebar-right">
            <FrontendScreenSections sections={sections} emptyState={emptyState} />
            {sidebar}
          </SectionGrid>
        ) : (
          <FrontendScreenSections
            sections={sections}
            emptyState={emptyState}
            className="mx-auto w-full max-w-xl"
          />
        )}
      </PageContent>
    </>
  );
}
