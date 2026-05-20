import * as React from "react";

import { cn } from "@moritzbrantner/ui";

import { DashboardScreen, type DashboardScreenProps } from "./dashboard-screen";
import { DetailScreen, type DetailScreenProps } from "./detail-screen";
import { FormScreen, type FormScreenProps } from "./form-screen";
import {
  MobileDashboardScreen,
  MobileDetailScreen,
  MobileFormScreen,
  MobileWorkbenchScreen,
} from "./mobile-screen";
import { WorkbenchScreen, type WorkbenchScreenProps } from "./workbench-screen";

type AdaptiveMobileSlots = {
  mobileLeading?: React.ReactNode;
  mobileTrailing?: React.ReactNode;
  mobileNavigation?: React.ReactNode;
  mobileSummary?: React.ReactNode;
  mobileCompanion?: React.ReactNode;
  mobileBottomActions?: React.ReactNode;
  mobileFooter?: React.ReactNode;
  mobileClassName?: string;
  mobileContentClassName?: string;
  desktopClassName?: string;
};

export type AdaptiveDashboardScreenProps = DashboardScreenProps & AdaptiveMobileSlots;
export type AdaptiveDetailScreenProps = DetailScreenProps & AdaptiveMobileSlots;
export type AdaptiveFormScreenProps = FormScreenProps & AdaptiveMobileSlots;
export type AdaptiveWorkbenchScreenProps = WorkbenchScreenProps &
  AdaptiveMobileSlots & {
    mobileComposer?: React.ReactNode;
  };

export function AdaptiveDashboardScreen({
  mobileLeading,
  mobileTrailing,
  mobileNavigation,
  mobileSummary,
  mobileCompanion,
  mobileBottomActions,
  mobileFooter,
  mobileClassName,
  mobileContentClassName,
  desktopClassName,
  ...props
}: AdaptiveDashboardScreenProps) {
  return (
    <AdaptiveScreenPair
      mobile={
        <MobileDashboardScreen
          eyebrow={props.eyebrow}
          title={props.title}
          description={props.description}
          primaryAction={props.primaryAction}
          secondaryActions={props.secondaryActions}
          sections={props.sections}
          emptyState={props.emptyState}
          leading={mobileLeading}
          trailing={mobileTrailing}
          navigation={mobileNavigation}
          summary={mobileSummary ?? props.summary}
          companion={mobileCompanion ?? props.sidebar}
          bottomActions={mobileBottomActions}
          footer={mobileFooter}
          className={mobileClassName}
          contentClassName={mobileContentClassName}
        />
      }
      desktop={
        <div className={desktopClassName}>
          <DashboardScreen {...props} />
        </div>
      }
    />
  );
}

export function AdaptiveDetailScreen({
  mobileLeading,
  mobileTrailing,
  mobileNavigation,
  mobileSummary,
  mobileCompanion,
  mobileBottomActions,
  mobileFooter,
  mobileClassName,
  mobileContentClassName,
  desktopClassName,
  ...props
}: AdaptiveDetailScreenProps) {
  return (
    <AdaptiveScreenPair
      mobile={
        <MobileDetailScreen
          eyebrow={props.eyebrow}
          title={props.title}
          description={props.description}
          primaryAction={props.primaryAction}
          secondaryActions={props.secondaryActions}
          sections={props.sections}
          emptyState={props.emptyState}
          leading={mobileLeading}
          trailing={mobileTrailing}
          navigation={mobileNavigation}
          summary={mobileSummary}
          companion={mobileCompanion ?? props.sidebar}
          bottomActions={mobileBottomActions}
          footer={mobileFooter}
          className={mobileClassName}
          contentClassName={mobileContentClassName}
        />
      }
      desktop={
        <div className={desktopClassName}>
          <DetailScreen {...props} />
        </div>
      }
    />
  );
}

export function AdaptiveFormScreen({
  mobileLeading,
  mobileTrailing,
  mobileNavigation,
  mobileSummary,
  mobileCompanion,
  mobileBottomActions,
  mobileFooter,
  mobileClassName,
  mobileContentClassName,
  desktopClassName,
  ...props
}: AdaptiveFormScreenProps) {
  return (
    <AdaptiveScreenPair
      mobile={
        <MobileFormScreen
          eyebrow={props.eyebrow}
          title={props.title}
          description={props.description}
          primaryAction={props.primaryAction}
          secondaryActions={props.secondaryActions}
          sections={props.sections}
          emptyState={props.emptyState}
          leading={mobileLeading}
          trailing={mobileTrailing}
          navigation={mobileNavigation}
          summary={mobileSummary}
          companion={mobileCompanion ?? props.sidebar}
          bottomActions={mobileBottomActions}
          footer={mobileFooter}
          className={mobileClassName}
          contentClassName={mobileContentClassName}
        />
      }
      desktop={
        <div className={desktopClassName}>
          <FormScreen {...props} />
        </div>
      }
    />
  );
}

export function AdaptiveWorkbenchScreen({
  mobileLeading,
  mobileTrailing,
  mobileNavigation,
  mobileSummary,
  mobileCompanion,
  mobileBottomActions,
  mobileFooter,
  mobileClassName,
  mobileContentClassName,
  desktopClassName,
  mobileComposer,
  ...props
}: AdaptiveWorkbenchScreenProps) {
  return (
    <AdaptiveScreenPair
      mobile={
        <MobileWorkbenchScreen
          eyebrow={props.eyebrow}
          title={props.title}
          description={props.description}
          primaryAction={props.primaryAction}
          secondaryActions={props.secondaryActions}
          sections={props.sections}
          emptyState={props.emptyState}
          leading={mobileLeading}
          trailing={mobileTrailing}
          navigation={mobileNavigation}
          summary={mobileSummary}
          companion={mobileCompanion ?? props.sidebar}
          bottomActions={mobileBottomActions}
          footer={mobileFooter}
          composer={mobileComposer}
          className={mobileClassName}
          contentClassName={mobileContentClassName}
        />
      }
      desktop={
        <div className={desktopClassName}>
          <WorkbenchScreen {...props} />
        </div>
      }
    />
  );
}

function AdaptiveScreenPair({
  mobile,
  desktop,
}: {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
}) {
  return (
    <>
      <div data-slot="adaptive-screen-mobile" className={cn("md:hidden")}>
        {mobile}
      </div>
      <div data-slot="adaptive-screen-desktop" className={cn("hidden md:block")}>
        {desktop}
      </div>
    </>
  );
}
