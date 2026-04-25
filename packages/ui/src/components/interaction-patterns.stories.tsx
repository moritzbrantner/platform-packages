import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MessageCircleIcon, SlidersHorizontalIcon } from "lucide-react";
import { expect } from "storybook/test";

import { Badge } from "./badge";
import { Button } from "./button";
import {
  Chat,
  ChatActions,
  ChatBubble,
  ChatComposer,
  ChatComposerInput,
  ChatDescription,
  ChatHeader,
  ChatMessage,
  ChatMessageAvatar,
  ChatMessageContent,
  ChatMessageMeta,
  ChatSendButton,
  ChatThread,
  ChatTitle,
} from "./chat";
import {
  MobileSlide,
  MobileSlideBody,
  MobileSlideClose,
  MobileSlideContent,
  MobileSlideDescription,
  MobileSlideFooter,
  MobileSlideHeader,
  MobileSlideTitle,
  MobileSlideTrigger,
} from "./mobile-slide";
import { ToggleSetting } from "./toggle-setting";

function InteractionPatternsPreview() {
  const [draft, setDraft] = React.useState("Can you check the package export map?");
  const [notifications, setNotifications] = React.useState(true);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 p-6">
      <div className="grid gap-2">
        <Badge variant="outline" className="w-fit">
          Interaction patterns
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Toggle, slide, and chat</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="grid content-start gap-4">
          <ToggleSetting
            title="Push notifications"
            description="Send alerts for release blockers and reviewer replies."
            checked={notifications}
            onCheckedChange={setNotifications}
            detail={notifications ? "Enabled for this workspace" : "Disabled for this workspace"}
          />

          <MobileSlide>
            <MobileSlideTrigger asChild>
              <Button variant="outline" className="w-fit">
                <SlidersHorizontalIcon />
                Open mobile slide
              </Button>
            </MobileSlideTrigger>
            <MobileSlideContent showCloseButton>
              <MobileSlideHeader>
                <MobileSlideTitle>Release filters</MobileSlideTitle>
                <MobileSlideDescription>
                  Compact controls for small screens and touch workflows.
                </MobileSlideDescription>
              </MobileSlideHeader>
              <MobileSlideBody className="grid gap-3">
                <ToggleSetting
                  title="Only blockers"
                  description="Hide informational package updates."
                  defaultChecked
                />
                <ToggleSetting title="Assigned to me" description="Keep the review queue focused." />
              </MobileSlideBody>
              <MobileSlideFooter>
                <MobileSlideClose asChild>
                  <Button>Apply filters</Button>
                </MobileSlideClose>
              </MobileSlideFooter>
            </MobileSlideContent>
          </MobileSlide>
        </div>

        <Chat className="min-h-[28rem]">
          <ChatHeader>
            <div>
              <ChatTitle>Package review chat</ChatTitle>
              <ChatDescription>Workspace thread for release coordination.</ChatDescription>
            </div>
            <ChatActions>
              <Button variant="ghost" size="icon-sm" aria-label="Open chat settings">
                <MessageCircleIcon />
              </Button>
            </ChatActions>
          </ChatHeader>
          <ChatThread>
            <ChatMessage>
              <ChatMessageAvatar>MB</ChatMessageAvatar>
              <ChatMessageContent>
                <ChatMessageMeta>Moritz, 09:12</ChatMessageMeta>
                <ChatBubble>The UI package is ready for the interaction pass.</ChatBubble>
              </ChatMessageContent>
            </ChatMessage>
            <ChatMessage align="end">
              <ChatMessageContent>
                <ChatMessageMeta>You, 09:14</ChatMessageMeta>
                <ChatBubble>{draft}</ChatBubble>
              </ChatMessageContent>
            </ChatMessage>
            <ChatMessage align="center">
              <ChatMessageContent>
                <ChatBubble>Storybook checks started</ChatBubble>
              </ChatMessageContent>
            </ChatMessage>
          </ChatThread>
          <ChatComposer
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <ChatComposerInput
              aria-label="Message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <ChatSendButton />
          </ChatComposer>
        </Chat>
      </div>
    </div>
  );
}

const meta = {
  title: "Recipes/Interaction patterns",
  component: InteractionPatternsPreview,
  tags: ["autodocs", "test"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof InteractionPatternsPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  play: async ({ canvas, userEvent }) => {
    const notifications = canvas.getByRole("switch", { name: "Push notifications" });
    await userEvent.click(notifications);
    await expect(notifications).toHaveAttribute("aria-checked", "false");

    await expect(canvas.getByRole("log")).toBeVisible();
    await expect(canvas.getByRole("textbox", { name: "Message" })).toHaveValue(
      "Can you check the package export map?",
    );
  },
};
