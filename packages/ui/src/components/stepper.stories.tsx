import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import {
  Stepper,
  StepperConnector,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperTitle,
} from "./stepper";

const steps = [
  {
    title: "Configure",
    description: "Choose package metadata and owners.",
    status: "complete",
  },
  {
    title: "Review",
    description: "Check component stories and type exports.",
    status: "current",
  },
  {
    title: "Publish",
    description: "Build, tag, and publish the package.",
    status: "incomplete",
  },
] as const;

function StepperDemo({ orientation = "horizontal" }: { orientation?: "horizontal" | "vertical" }) {
  return (
    <Stepper orientation={orientation} className="w-[640px] max-w-[calc(100vw-2rem)]">
      {steps.map((step, index) => (
        <StepperItem key={step.title} status={step.status}>
          <StepperIndicator>{step.status === "complete" ? null : index + 1}</StepperIndicator>
          <StepperContent>
            <StepperTitle>{step.title}</StepperTitle>
            <StepperDescription>{step.description}</StepperDescription>
          </StepperContent>
          {index < steps.length - 1 ? <StepperConnector /> : null}
        </StepperItem>
      ))}
    </Stepper>
  );
}

const meta = {
  title: "Components/Stepper",
  component: StepperDemo,
  tags: ["autodocs", "test"],
  args: {
    orientation: "horizontal",
  },
  argTypes: {
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof StepperDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Configure")).toBeVisible();
    await expect(canvas.getByText("Review")).toBeVisible();
    await expect(canvas.getByText("Publish")).toBeVisible();
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
};

export const WithError: Story = {
  render: () => (
    <Stepper orientation="vertical" className="w-[420px]">
      <StepperItem status="complete">
        <StepperIndicator />
        <StepperContent>
          <StepperTitle>Source checked</StepperTitle>
          <StepperDescription>All files were discovered.</StepperDescription>
        </StepperContent>
        <StepperConnector />
      </StepperItem>
      <StepperItem status="error">
        <StepperIndicator>!</StepperIndicator>
        <StepperContent>
          <StepperTitle>Type check failed</StepperTitle>
          <StepperDescription>Fix exported component props before publishing.</StepperDescription>
        </StepperContent>
      </StepperItem>
    </Stepper>
  ),
};
