import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import {
  LogicalArgument,
  LogicalArgumentConclusion,
  LogicalArgumentHeader,
  LogicalArgumentInference,
  LogicalArgumentPremise,
  LogicalArgumentPremiseList,
  LogicalArgumentStatusBadge,
  LogicalArgumentTitle,
  type LogicalArgumentData,
} from "..";

const argument = {
  id: "argument",
  title: "The release is ready",
  status: "sound",
  premises: [
    {
      id: "tests",
      label: "P1",
      text: "The release branch has passing tests.",
      note: "CI completed successfully.",
    },
    {
      id: "approval",
      text: "The product owner approved the release notes.",
    },
  ],
  inferenceRule: "Conjunction elimination",
  conclusion: {
    id: "ready",
    text: "The release can proceed.",
  },
  children: [
    {
      id: "risk",
      title: "Dependency risk",
      relation: "undercuts",
      status: "open",
      premises: [{ id: "dependency", text: "A dependency advisory was published today." }],
      conclusion: { id: "review", text: "The release may need one more security review." },
    },
  ],
} satisfies LogicalArgumentData;

describe("LogicalArgument", () => {
  test("renders a structured argument with premises, inference, conclusion, and badges", () => {
    render(<LogicalArgument argument={argument} data-testid="argument" />);

    const root = screen.getByTestId("argument");

    expect(root.getAttribute("data-status")).toBe("sound");
    expect(screen.getByText("The release is ready")).toBeTruthy();
    expect(within(root).getAllByText("P1")).toHaveLength(2);
    expect(screen.getByText("The release branch has passing tests.")).toBeTruthy();
    expect(screen.getByText("CI completed successfully.")).toBeTruthy();
    expect(screen.getByText("Conjunction elimination")).toBeTruthy();
    expect(screen.getByText("The release can proceed.")).toBeTruthy();
    expect(screen.getByText("Sound")).toBeTruthy();
  });

  test("renders nested related arguments", () => {
    render(<LogicalArgument argument={argument} />);

    const nestedArgument = screen.getByText("Dependency risk").closest("article");

    expect(nestedArgument).toBeTruthy();
    expect(nestedArgument?.getAttribute("data-depth")).toBe("1");
    expect(within(nestedArgument as HTMLElement).getByText("Undercuts")).toBeTruthy();
    expect(within(nestedArgument as HTMLElement).getByText("Open")).toBeTruthy();
  });

  test("supports slot composition and forwarded class names", () => {
    render(
      <LogicalArgument className="custom-argument" data-testid="custom">
        <LogicalArgumentHeader>
          <LogicalArgumentTitle>Manual argument</LogicalArgumentTitle>
          <LogicalArgumentStatusBadge status="valid" />
        </LogicalArgumentHeader>
        <LogicalArgumentPremiseList>
          <LogicalArgumentPremise label="P1">
            Every reviewed change has an owner.
          </LogicalArgumentPremise>
        </LogicalArgumentPremiseList>
        <LogicalArgumentInference>Universal instantiation</LogicalArgumentInference>
        <LogicalArgumentConclusion label="C">
          This reviewed change has an owner.
        </LogicalArgumentConclusion>
      </LogicalArgument>,
    );

    expect(screen.getByTestId("custom").className).toContain("custom-argument");
    expect(screen.getByText("Manual argument")).toBeTruthy();
    expect(screen.getByText("Valid")).toBeTruthy();
    expect(screen.getByText("This reviewed change has an owner.")).toBeTruthy();
  });
});
