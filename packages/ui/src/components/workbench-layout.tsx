"use client";

import * as React from "react";

import { cn } from "../lib/cn";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./resizable";

type WorkbenchLayoutProps = React.ComponentProps<"div"> & {
  toolbar?: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  bottomPanel?: React.ReactNode;
  children: React.ReactNode;
  leftPanelDefaultSize?: number;
  rightPanelDefaultSize?: number;
  bottomPanelDefaultSize?: number;
  collapsiblePanels?: boolean;
};

type WorkbenchPanelProps = React.ComponentProps<"div"> & {
  side?: "left" | "right" | "bottom";
};

function WorkbenchLayout({
  toolbar,
  leftPanel,
  rightPanel,
  bottomPanel,
  children,
  leftPanelDefaultSize = 22,
  rightPanelDefaultSize = 26,
  bottomPanelDefaultSize = 28,
  collapsiblePanels = true,
  className,
  ...props
}: WorkbenchLayoutProps) {
  const hasSidePanels = Boolean(leftPanel || rightPanel);

  return (
    <div
      data-slot="workbench-layout"
      className={cn(
        "grid min-h-0 w-full overflow-hidden rounded-md border border-border/60 bg-background text-foreground",
        className,
      )}
      {...props}
    >
      {toolbar ? <WorkbenchToolbar>{toolbar}</WorkbenchToolbar> : null}
      <div className="grid min-h-0 lg:hidden">
        {leftPanel ? <WorkbenchPanel side="left">{leftPanel}</WorkbenchPanel> : null}
        <WorkbenchCanvas>{children}</WorkbenchCanvas>
        {rightPanel ? <WorkbenchPanel side="right">{rightPanel}</WorkbenchPanel> : null}
        {bottomPanel ? <WorkbenchPanel side="bottom">{bottomPanel}</WorkbenchPanel> : null}
      </div>
      <div className="hidden min-h-0 lg:block">
        <ResizablePanelGroup orientation="vertical" className="min-h-[28rem]">
          <ResizablePanel defaultSize={100 - (bottomPanel ? bottomPanelDefaultSize : 0)} minSize={42}>
            {hasSidePanels ? (
              <ResizablePanelGroup orientation="horizontal" className="min-h-full">
                {leftPanel ? (
                  <>
                    <ResizablePanel
                      defaultSize={leftPanelDefaultSize}
                      minSize={16}
                      collapsible={collapsiblePanels}
                    >
                      <WorkbenchPanel side="left" className="h-full border-r-0">
                        {leftPanel}
                      </WorkbenchPanel>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                  </>
                ) : null}
                <ResizablePanel defaultSize={100 - leftPanelDefaultSize - rightPanelDefaultSize} minSize={36}>
                  <WorkbenchCanvas className="h-full">{children}</WorkbenchCanvas>
                </ResizablePanel>
                {rightPanel ? (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel
                      defaultSize={rightPanelDefaultSize}
                      minSize={18}
                      collapsible={collapsiblePanels}
                    >
                      <WorkbenchPanel side="right" className="h-full border-l-0">
                        {rightPanel}
                      </WorkbenchPanel>
                    </ResizablePanel>
                  </>
                ) : null}
              </ResizablePanelGroup>
            ) : (
              <WorkbenchCanvas className="h-full">{children}</WorkbenchCanvas>
            )}
          </ResizablePanel>
          {bottomPanel ? (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel
                defaultSize={bottomPanelDefaultSize}
                minSize={14}
                collapsible={collapsiblePanels}
              >
                <WorkbenchPanel side="bottom" className="h-full border-b-0 border-x-0">
                  {bottomPanel}
                </WorkbenchPanel>
              </ResizablePanel>
            </>
          ) : null}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

function WorkbenchPanel({ side = "left", className, ...props }: WorkbenchPanelProps) {
  return (
    <div
      data-slot="workbench-panel"
      data-side={side}
      className={cn(
        "min-h-0 overflow-auto border-border/60 bg-card/65 p-3 text-sm data-[side=bottom]:border-t data-[side=left]:border-b data-[side=right]:border-b lg:data-[side=left]:border-r lg:data-[side=right]:border-l",
        className,
      )}
      {...props}
    />
  );
}

function WorkbenchCanvas({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="workbench-canvas"
      className={cn("min-h-0 overflow-auto bg-background p-4", className)}
      {...props}
    />
  );
}

function WorkbenchToolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="workbench-toolbar"
      className={cn("flex min-h-11 flex-wrap items-center gap-2 border-b bg-card/75 px-3 py-2", className)}
      {...props}
    />
  );
}

export {
  WorkbenchCanvas,
  WorkbenchLayout,
  WorkbenchPanel,
  WorkbenchToolbar,
  type WorkbenchLayoutProps,
  type WorkbenchPanelProps,
};
