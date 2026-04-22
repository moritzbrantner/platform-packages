import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import {
  AnnotationCanvas,
  type AnnotationCanvasAnnotation,
  type AnnotationCanvasTool,
} from "./annotation-canvas";

const initialAnnotations: AnnotationCanvasAnnotation[] = [
  {
    id: "headline",
    shape: "rectangle",
    label: "Headline",
    color: "#2563eb",
    points: [
      { x: 80, y: 70 },
      { x: 260, y: 140 },
    ],
  },
  {
    id: "anchor",
    shape: "point",
    label: "Anchor",
    color: "#dc2626",
    points: [{ x: 420, y: 210 }],
  },
];

function AnnotationCanvasDemo({
  onAnnotationsChange,
}: {
  onAnnotationsChange?: (annotations: AnnotationCanvasAnnotation[]) => void;
}) {
  const [annotations, setAnnotations] = React.useState(initialAnnotations);
  const [selectedAnnotationId, setSelectedAnnotationId] = React.useState<string | null>("headline");
  const [tool, setTool] = React.useState<AnnotationCanvasTool>("select");

  return (
    <AnnotationCanvas
      annotations={annotations}
      selectedAnnotationId={selectedAnnotationId}
      tool={tool}
      width={640}
      height={360}
      onToolChange={setTool}
      onSelectedAnnotationChange={setSelectedAnnotationId}
      onAnnotationsChange={(nextAnnotations) => {
        setAnnotations(nextAnnotations);
        onAnnotationsChange?.(nextAnnotations);
      }}
      className="max-w-3xl"
    />
  );
}

const meta = {
  title: "Components/AnnotationCanvas",
  component: AnnotationCanvasDemo,
  tags: ["autodocs", "test"],
  args: {
    onAnnotationsChange: fn(),
  },
} satisfies Meta<typeof AnnotationCanvasDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Point" }));
    await expect(canvas.getByRole("button", { name: "Point" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};
