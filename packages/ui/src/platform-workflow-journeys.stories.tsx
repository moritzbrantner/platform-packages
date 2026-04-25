import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import {
  PlatformWorkflowDemo,
  type WorkflowScenario,
  workflowScenarios,
} from "./storybook/platform-workflow-demo";

const meta = {
  title: "Workflows/Journeys",
  component: PlatformWorkflowDemo,
  tags: ["autodocs", "test"],
  parameters: {
    layout: "fullscreen",
    a11y: {
      test: "todo",
    },
  },
  args: {
    visitorNavigationLabel: "Discover",
  },
  argTypes: {
    visitorNavigationLabel: {
      control: "text",
    },
  },
} satisfies Meta<typeof PlatformWorkflowDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

function getScenarioArgs(scenario: WorkflowScenario) {
  return {
    initialRoute: scenario.initialRoute,
    initialSession: scenario.initialSession,
    initialProfileId: scenario.initialProfileId ?? "mira",
  } as const;
}

async function runNamedStep(
  step:
    | ((label: string, play: () => Promise<void>) => void | Promise<void>)
    | undefined,
  label: string,
  play: () => Promise<void>,
) {
  if (step) {
    await step(label, play);
    return;
  }

  await play();
}

export const MainToAbout: Story = {
  args: getScenarioArgs(workflowScenarios.mainToAbout),
  play: async ({ canvas, step, userEvent }) => {
    await runNamedStep(step, "Open the about screen from the main page", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "About" }));

      await expect(canvas.getByRole("heading", { name: "About" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Back to main" })).toBeVisible();
    });
  },
};

export const MainToLoginToHome: Story = {
  args: getScenarioArgs(workflowScenarios.mainToLoginToHome),
  play: async ({ canvas, step, userEvent }) => {
    await runNamedStep(step, "Branch from the main page into login", async () => {
      await userEvent.click(canvas.getAllByRole("button", { name: "Login" })[0]);

      await expect(canvas.getByRole("heading", { name: "Login" })).toBeVisible();
    });

    await runNamedStep(step, "Sign in and land on the workspace home", async () => {
      await userEvent.clear(canvas.getByLabelText("Email"));
      await userEvent.type(canvas.getByLabelText("Email"), "demo@example.com");
      await userEvent.type(canvas.getByLabelText("Password"), "correct-horse");
      await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));

      await expect(canvas.getByRole("heading", { name: "Home" })).toBeVisible();
      await expect(canvas.getByRole("alert")).toHaveTextContent("Signed in as demo@example.com");
    });
  },
};

export const MainToRegisterToHome: Story = {
  args: getScenarioArgs(workflowScenarios.mainToRegisterToHome),
  play: async ({ canvas, step, userEvent }) => {
    await runNamedStep(step, "Branch from the main page into registration", async () => {
      await userEvent.click(canvas.getAllByRole("button", { name: "Create account" })[0]);

      await expect(canvas.getByRole("heading", { name: "Register" })).toBeVisible();
    });

    await runNamedStep(step, "Register and reuse the signed-in home screen", async () => {
      await userEvent.type(canvas.getByLabelText("Display name"), "Ada Lovelace");
      await userEvent.clear(canvas.getByLabelText("Work email"));
      await userEvent.type(canvas.getByLabelText("Work email"), "ada@example.com");
      await userEvent.click(canvas.getAllByRole("button", { name: "Create account" }).at(-1)!);

      await expect(canvas.getByRole("heading", { name: "Home" })).toBeVisible();
      await expect(canvas.getByRole("alert")).toHaveTextContent(
        "Workspace profile created for Ada Lovelace",
      );
    });
  },
};

export const MainToPasswordRecovery: Story = {
  args: getScenarioArgs(workflowScenarios.mainToPasswordRecovery),
  play: async ({ canvas, step, userEvent }) => {
    await runNamedStep(step, "Open login before password recovery", async () => {
      await userEvent.click(canvas.getAllByRole("button", { name: "Login" })[0]);

      await expect(canvas.getByRole("heading", { name: "Login" })).toBeVisible();
    });

    await runNamedStep(step, "Continue into password recovery and stay in visitor mode", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Forgot password?" }));
      await expect(canvas.getByRole("heading", { name: "Password forgotten" })).toBeVisible();

      await userEvent.clear(canvas.getByLabelText("Recovery email"));
      await userEvent.type(canvas.getByLabelText("Recovery email"), "reset@example.com");
      await userEvent.click(canvas.getByRole("button", { name: "Send reset link" }));

      await expect(canvas.getByRole("alert")).toHaveTextContent(
        "Reset link sent to reset@example.com",
      );
      await expect(canvas.getByText("Visitor")).toBeVisible();
    });
  },
};

export const HomeToPeopleToProfileToChat: Story = {
  args: getScenarioArgs(workflowScenarios.homeToPeopleToProfileToChat),
  play: async ({ canvas, step, userEvent }) => {
    await runNamedStep(step, "Move from home into the people directory", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Open social overview" }));
      await userEvent.click(canvas.getByRole("button", { name: "Open people" }));

      await expect(canvas.getByRole("heading", { name: "People" })).toBeVisible();
    });

    await runNamedStep(step, "Follow a profile and open its profile page", async () => {
      const followJordan = canvas.getByRole("button", { name: "Follow Jordan Ellis" });

      await userEvent.click(followJordan);
      await expect(followJordan).toHaveTextContent("Following");

      await userEvent.click(canvas.getByRole("button", { name: "Open Jordan Ellis profile" }));

      await expect(canvas.getByRole("heading", { name: "Jordan Ellis" })).toBeVisible();
      await expect(
        canvas.getByRole("button", { name: "Unfollow Jordan Ellis" }),
      ).toHaveTextContent("Following");
    });

    await runNamedStep(step, "Branch from the profile into chat", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Open chat" }));

      await expect(canvas.getByRole("heading", { name: "Chat with Jordan Ellis" })).toBeVisible();
      await expect(canvas.getByRole("textbox", { name: "Message" })).toBeVisible();
    });
  },
};

export const HomeToSocialToFollowers: Story = {
  args: getScenarioArgs(workflowScenarios.homeToSocialToFollowers),
  play: async ({ canvas, step, userEvent }) => {
    await runNamedStep(step, "Open the signed-in social overview from home", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Open social overview" }));

      await expect(canvas.getByRole("heading", { name: "Social overview" })).toBeVisible();
    });

    await runNamedStep(step, "Open followers from the social branch", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Open followers overview" }));

      await expect(canvas.getByRole("heading", { name: "Followers overview" })).toBeVisible();
      await expect(canvas.getAllByText("Sofia Nguyen")[0]).toBeVisible();
    });
  },
};

export const HomeToSettingsSave: Story = {
  args: getScenarioArgs(workflowScenarios.homeToSettingsSave),
  play: async ({ canvas, step, userEvent }) => {
    await runNamedStep(step, "Open settings from the workspace home", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Open settings" }));

      await expect(canvas.getByRole("heading", { name: "Settings" })).toBeVisible();
    });

    await runNamedStep(step, "Save settings and show an in-app notice", async () => {
      await userEvent.clear(canvas.getByLabelText("Display name"));
      await userEvent.type(canvas.getByLabelText("Display name"), "Workflow reviewer");
      await userEvent.click(canvas.getByRole("button", { name: "Save settings" }));

      await expect(canvas.getByRole("alert")).toHaveTextContent(
        "Settings saved for Workflow reviewer",
      );
    });
  },
};
