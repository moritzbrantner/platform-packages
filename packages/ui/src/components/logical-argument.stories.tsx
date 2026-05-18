import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Badge } from "./badge";
import {
  LogicalArgument,
  LogicalArgumentConclusion,
  LogicalArgumentHeader,
  LogicalArgumentInference,
  LogicalArgumentMeta,
  LogicalArgumentPremise,
  LogicalArgumentPremiseList,
  LogicalArgumentStatusBadge,
  LogicalArgumentTitle,
  type LogicalArgumentData,
} from "./logical-argument";

const moderationArgument = {
  id: "moderation-argument",
  title: "Model output requires review",
  description: "A compact proof display for reasoning, policy review, and evaluation flows.",
  status: "valid",
  premises: [
    {
      id: "sensitive-domain",
      text: "Outputs that affect eligibility decisions need a human review checkpoint.",
      note: "Policy requirement",
    },
    {
      id: "output-domain",
      text: "This output affects eligibility for a customer account action.",
    },
  ],
  inferenceRule: "Modus ponens",
  conclusion: {
    id: "needs-review",
    text: "This output needs a human review checkpoint before it is applied.",
  },
  children: [
    {
      id: "objection",
      title: "Automation objection",
      relation: "objects",
      status: "open",
      premises: [
        {
          id: "low-risk",
          text: "The user has an existing verified account and no prior enforcement history.",
        },
      ],
      conclusion: {
        id: "skip-review",
        text: "The review checkpoint might be unnecessary for this case.",
      },
    },
  ],
} satisfies LogicalArgumentData;

function LogicalArgumentPreview() {
  return (
    <div className="grid max-w-3xl gap-6">
      <LogicalArgument argument={moderationArgument} />

      <LogicalArgument>
        <LogicalArgumentHeader>
          <LogicalArgumentTitle>Custom layout</LogicalArgumentTitle>
          <LogicalArgumentMeta>
            <Badge variant="outline">Deductive</Badge>
            <LogicalArgumentStatusBadge status="sound" />
          </LogicalArgumentMeta>
        </LogicalArgumentHeader>
        <LogicalArgumentPremiseList>
          <LogicalArgumentPremise label="P1">
            All active incidents have an owner.
          </LogicalArgumentPremise>
          <LogicalArgumentPremise label="P2">Incident I-42 is active.</LogicalArgumentPremise>
        </LogicalArgumentPremiseList>
        <LogicalArgumentInference>Universal instantiation</LogicalArgumentInference>
        <LogicalArgumentConclusion label="C">Incident I-42 has an owner.</LogicalArgumentConclusion>
      </LogicalArgument>
    </div>
  );
}

const meta = {
  title: "Components/Logical Argument",
  component: LogicalArgumentPreview,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof LogicalArgumentPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Model output requires review")).toBeVisible();
    await expect(canvas.getByText("Modus ponens")).toBeVisible();
    await expect(canvas.getByText("Automation objection")).toBeVisible();
    await expect(canvas.getByText("Custom layout")).toBeVisible();
  },
};
