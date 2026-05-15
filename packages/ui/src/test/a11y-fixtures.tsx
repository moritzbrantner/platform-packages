import * as React from "react";

import { Button } from "../components/button";
import { Input } from "../components/input";

function FocusableFixture() {
  return (
    <div data-slot="a11y-focusable-fixture" className="flex flex-wrap gap-2">
      <Button>First action</Button>
      <Button variant="outline">Second action</Button>
      <Input aria-label="Focusable input" placeholder="Focusable input" className="max-w-48" />
    </div>
  );
}

function LongLabelFixture() {
  return (
    <div data-slot="a11y-long-label-fixture" className="max-w-64 text-sm">
      This is an intentionally long label used to verify wrapping, truncation, and constrained-width
      behavior in reusable UI surfaces.
    </div>
  );
}

function ReducedMotionFixture({ children }: { children?: React.ReactNode }) {
  return (
    <div data-slot="a11y-reduced-motion-fixture" className="motion-reduce:transition-none">
      {children}
    </div>
  );
}

function ConstrainedWidthFixture({ children }: { children?: React.ReactNode }) {
  return (
    <div data-slot="a11y-constrained-width-fixture" className="w-80 min-w-0 rounded-md border p-3">
      {children}
    </div>
  );
}

export {
  ConstrainedWidthFixture,
  FocusableFixture,
  LongLabelFixture,
  ReducedMotionFixture,
};
