"use client";

import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MessageCircleIcon } from "lucide-react";
import { expect } from "storybook/test";

import { Button } from "./button";
import {
  ChatBox,
  ChatBoxActions,
  ChatBoxBody,
  ChatBoxBubble,
  ChatBoxDescription,
  ChatBoxFooter,
  ChatBoxHeader,
  ChatBoxMessage,
  ChatBoxMeta,
  ChatBoxTitle,
} from "./chat-box";
import {
  ImageFilterEditor,
  type ImageFilterValue,
  imageFilterPresets,
} from "./image-filter-editor";
import {
  ProfileSummary,
  ProfileSummaryActions,
  ProfileSummaryAvatar,
  ProfileSummaryContent,
  ProfileSummaryDescription,
  ProfileSummaryHeader,
  ProfileSummaryMeta,
  ProfileSummaryStat,
  ProfileSummaryStatLabel,
  ProfileSummaryStatValue,
  ProfileSummaryStats,
  ProfileSummarySubtitle,
  ProfileSummaryTitle,
} from "./profile-summary";
import { FollowButton, LikeButton, ShareButton, SocialActionGroup } from "./social-actions";

const previewImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 960 540'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23f97316'/%3E%3Cstop offset='.48' stop-color='%2314b8a6'/%3E%3Cstop offset='1' stop-color='%233b82f6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='960' height='540' fill='url(%23g)'/%3E%3Ccircle cx='710' cy='180' r='92' fill='%23ffffff' fill-opacity='.72'/%3E%3Cpath d='M80 420 280 210l154 150 120-92 326 152v76H80z' fill='%230f172a' fill-opacity='.42'/%3E%3C/svg%3E";

function SocialComponentsPreview() {
  const [liked, setLiked] = React.useState(true);
  const [following, setFollowing] = React.useState(false);
  const [filter, setFilter] = React.useState<ImageFilterValue>(imageFilterPresets[0].value);

  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid gap-6">
        <ProfileSummary>
          <ProfileSummaryAvatar name="Mira Patel" initials="MP" online />
          <ProfileSummaryContent>
            <ProfileSummaryHeader>
              <div className="min-w-0">
                <ProfileSummaryTitle>Mira Patel</ProfileSummaryTitle>
                <ProfileSummarySubtitle>Product systems lead</ProfileSummarySubtitle>
              </div>
              <ProfileSummaryActions>
                <FollowButton
                  following={following}
                  aria-label={following ? "Unfollow Mira Patel" : "Follow Mira Patel"}
                  onClick={() => setFollowing((current) => !current)}
                />
                <Button type="button" variant="outline">
                  <MessageCircleIcon />
                  Message
                </Button>
              </ProfileSummaryActions>
            </ProfileSummaryHeader>
            <ProfileSummaryDescription>
              Designs reusable social, media, and messaging workflows for product teams.
            </ProfileSummaryDescription>
            <ProfileSummaryMeta>
              <span>Berlin</span>
              <span>Available this week</span>
            </ProfileSummaryMeta>
            <ProfileSummaryStats>
              <ProfileSummaryStat>
                <ProfileSummaryStatLabel>Followers</ProfileSummaryStatLabel>
                <ProfileSummaryStatValue>1,280</ProfileSummaryStatValue>
              </ProfileSummaryStat>
              <ProfileSummaryStat>
                <ProfileSummaryStatLabel>Posts</ProfileSummaryStatLabel>
                <ProfileSummaryStatValue>48</ProfileSummaryStatValue>
              </ProfileSummaryStat>
              <ProfileSummaryStat>
                <ProfileSummaryStatLabel>Response</ProfileSummaryStatLabel>
                <ProfileSummaryStatValue>1h</ProfileSummaryStatValue>
              </ProfileSummaryStat>
            </ProfileSummaryStats>
            <SocialActionGroup>
              <LikeButton
                liked={liked}
                count={128}
                onClick={() => setLiked((current) => !current)}
              />
              <ShareButton count={16} />
            </SocialActionGroup>
          </ProfileSummaryContent>
        </ProfileSummary>

        <ImageFilterEditor
          src={previewImage}
          alt="Filtered landscape preview"
          value={filter}
          onValueChange={setFilter}
        />
      </div>

      <ChatBox className="min-h-[32rem]">
        <ChatBoxHeader>
          <div className="min-w-0">
            <ChatBoxTitle>Chat with Mira</ChatBoxTitle>
            <ChatBoxDescription>Active now</ChatBoxDescription>
          </div>
          <ChatBoxActions>
            <FollowButton
              following={following}
              size="sm"
              aria-label={following ? "Unfollow Mira Patel" : "Follow Mira Patel"}
              onClick={() => setFollowing((current) => !current)}
            />
          </ChatBoxActions>
        </ChatBoxHeader>
        <ChatBoxBody>
          <ChatBoxMessage>
            <ChatBoxMeta>Mira, 09:30</ChatBoxMeta>
            <ChatBoxBubble>The filtered image draft is ready for profile review.</ChatBoxBubble>
          </ChatBoxMessage>
          <ChatBoxMessage align="end">
            <ChatBoxMeta>You, 09:34</ChatBoxMeta>
            <ChatBoxBubble>I added the social actions and compact summary.</ChatBoxBubble>
          </ChatBoxMessage>
          <ChatBoxMessage align="center">
            <ChatBoxBubble>Profile shared with the design channel.</ChatBoxBubble>
          </ChatBoxMessage>
        </ChatBoxBody>
        <ChatBoxFooter>
          <SocialActionGroup>
            <LikeButton
              liked={liked}
              count={128}
              size="sm"
              onClick={() => setLiked((current) => !current)}
            />
            <ShareButton count={16} size="sm" />
          </SocialActionGroup>
        </ChatBoxFooter>
      </ChatBox>
    </div>
  );
}

const meta = {
  title: "Components/Social",
  component: SocialComponentsPreview,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof SocialComponentsPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Mira Patel")).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: "Unlike 128" })[0]).toBeVisible();
    await expect(canvas.getByAltText("Filtered landscape preview")).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "Chat with Mira" })).toBeVisible();
  },
};
