"use client";

import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarClockIcon, MessageCircleIcon, SparklesIcon } from "lucide-react";
import { expect } from "storybook/test";

import { Avatar } from "./avatar";
import { Button } from "./button";
import {
  ChatBox,
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
import { CommentButton, FollowButton, LikeButton, ShareButton, SocialActionGroup } from "./social-actions";
import {
  SocialComment,
  SocialCommentActions,
  SocialCommentAvatar,
  SocialCommentContent,
  SocialCommentList,
  SocialCommentMeta,
  SocialCommentText,
  SocialComposer,
  SocialComposerActions,
  SocialComposerHeader,
  SocialComposerTextarea,
  SocialComposerToolbar,
  SocialPost,
  SocialPostAuthor,
  SocialPostAuthorActions,
  SocialPostAvatar,
  SocialPostBody,
  SocialPostFooter,
  SocialPostHeader,
  SocialPostMedia,
  SocialPostMeta,
  SocialPostMetrics,
  SocialPostText,
  SocialPostTitle,
} from "./social-feed";

const previewImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 960 540'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23f97316'/%3E%3Cstop offset='.48' stop-color='%2314b8a6'/%3E%3Cstop offset='1' stop-color='%233b82f6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='960' height='540' fill='url(%23g)'/%3E%3Ccircle cx='710' cy='180' r='92' fill='%23ffffff' fill-opacity='.72'/%3E%3Cpath d='M80 420 280 210l154 150 120-92 326 152v76H80z' fill='%230f172a' fill-opacity='.42'/%3E%3C/svg%3E";

function SocialComponentsPreview() {
  const [liked, setLiked] = React.useState(true);
  const [commented, setCommented] = React.useState(true);
  const [following, setFollowing] = React.useState(false);
  const [draft, setDraft] = React.useState(
    "Locking the final camera move before today’s launch review. The motion pass now reads clean on mobile too.",
  );

  return (
    <div className="grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid gap-6">
        <SocialComposer onSubmit={(event) => event.preventDefault()}>
          <SocialComposerHeader>
            <Avatar name="Mira Patel" initials="MP" online />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Share an update</p>
              <p className="text-xs text-muted-foreground">Posting to Product Systems Circle</p>
            </div>
          </SocialComposerHeader>
          <SocialComposerTextarea
            aria-label="Post draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <SocialComposerToolbar>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <SparklesIcon className="size-3.5" />
                Motion notes attached
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarClockIcon className="size-3.5" />
                Publish this afternoon
              </span>
            </div>
            <SocialComposerActions>
              <Button type="button" variant="outline" size="sm">
                Save draft
              </Button>
              <Button type="submit" size="sm">
                Publish update
              </Button>
            </SocialComposerActions>
          </SocialComposerToolbar>
        </SocialComposer>

        <SocialPost featured>
          <SocialPostHeader>
            <SocialPostAvatar name="Mira Patel" initials="MP" online />
            <SocialPostAuthor>
              <SocialPostTitle>Mira Patel</SocialPostTitle>
              <SocialPostMeta>
                <span>Product systems lead</span>
                <span>12 min ago</span>
                <span>Berlin</span>
              </SocialPostMeta>
            </SocialPostAuthor>
            <SocialPostAuthorActions>
              <FollowButton
                following={following}
                size="sm"
                aria-label={following ? "Unfollow Mira Patel" : "Follow Mira Patel"}
                onClick={() => setFollowing((current) => !current)}
              />
            </SocialPostAuthorActions>
          </SocialPostHeader>
          <SocialPostBody>
            <SocialPostText>
              Launch rehearsal clips are live. I tightened the pacing between the hero transition
              and the dashboard reveal so the feed reads clearly on both desktop and mobile.
            </SocialPostText>
            <SocialPostMedia>
              <img src={previewImage} alt="Launch rehearsal clip preview" />
            </SocialPostMedia>
          </SocialPostBody>
          <SocialPostFooter>
            <SocialPostMetrics>
              <span>128 likes</span>
              <span>24 comments</span>
              <span>16 shares</span>
            </SocialPostMetrics>
            <SocialActionGroup>
              <LikeButton
                liked={liked}
                count={128}
                onClick={() => setLiked((current) => !current)}
              />
              <CommentButton
                commented={commented}
                count={24}
                onClick={() => setCommented((current) => !current)}
              />
              <ShareButton count={16} />
            </SocialActionGroup>
            <SocialCommentList aria-label="Recent comments">
              <SocialComment>
                <SocialCommentAvatar name="Jordan Ellis" initials="JE" />
                <SocialCommentContent>
                  <SocialCommentMeta>
                    <span>Jordan Ellis</span>
                    <span>9 min ago</span>
                  </SocialCommentMeta>
                  <SocialCommentText>
                    The mobile crop finally holds the subject. This is ready for the shared review
                    deck.
                  </SocialCommentText>
                  <SocialCommentActions>
                    <Button type="button" variant="link" size="xs" className="h-auto px-0 py-0">
                      Reply
                    </Button>
                    <Button type="button" variant="link" size="xs" className="h-auto px-0 py-0">
                      Like
                    </Button>
                  </SocialCommentActions>
                </SocialCommentContent>
              </SocialComment>
              <SocialComment align="end">
                <SocialCommentAvatar name="You" initials="YU" />
                <SocialCommentContent>
                  <SocialCommentMeta>
                    <span>You</span>
                    <span>now</span>
                  </SocialCommentMeta>
                  <SocialCommentText>
                    I’ll publish the final cut after the analytics overlay gets one last pass.
                  </SocialCommentText>
                </SocialCommentContent>
              </SocialComment>
            </SocialCommentList>
          </SocialPostFooter>
        </SocialPost>
      </div>

      <div className="grid gap-6">
        <ProfileSummary orientation="vertical">
          <ProfileSummaryAvatar name="Mira Patel" initials="MP" online />
          <ProfileSummaryContent>
            <ProfileSummaryHeader>
              <div className="min-w-0">
                <ProfileSummaryTitle>Mira Patel</ProfileSummaryTitle>
                <ProfileSummarySubtitle>Product systems lead</ProfileSummarySubtitle>
              </div>
              <ProfileSummaryActions>
                <Button type="button" size="sm" variant="outline">
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
            <ProfileSummaryStats className="sm:grid-cols-1">
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
          </ProfileSummaryContent>
        </ProfileSummary>

        <SocialPost>
          <SocialPostHeader>
            <SocialPostAvatar name="Design Channel" initials="DC" shape="square" />
            <SocialPostAuthor>
              <SocialPostTitle>Design Channel</SocialPostTitle>
              <SocialPostMeta>
                <span>Shared workspace</span>
                <span>just now</span>
              </SocialPostMeta>
            </SocialPostAuthor>
          </SocialPostHeader>
          <SocialPostBody>
            <SocialPostText>
              Review queue: 3 launch notes are waiting on approval. Your latest rehearsal update is
              pinned for handoff.
            </SocialPostText>
          </SocialPostBody>
        </SocialPost>

        <ChatBox variant="compact">
          <ChatBoxHeader>
            <div className="min-w-0">
              <ChatBoxTitle>Direct thread</ChatBoxTitle>
              <ChatBoxDescription>Mira is active now</ChatBoxDescription>
            </div>
          </ChatBoxHeader>
          <ChatBoxBody className="max-h-64">
            <ChatBoxMessage>
              <ChatBoxMeta>Mira, 09:30</ChatBoxMeta>
              <ChatBoxBubble>The feed update looks ready for review.</ChatBoxBubble>
            </ChatBoxMessage>
            <ChatBoxMessage align="end">
              <ChatBoxMeta>You, now</ChatBoxMeta>
              <ChatBoxBubble>I’m posting the final cut after the last analytics pass.</ChatBoxBubble>
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
    await expect(canvas.getByRole("button", { name: "Follow Mira Patel" })).toBeVisible();
    await expect(canvas.getByLabelText("Post draft")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Comment 24" })).toBeVisible();
    await expect(canvas.getByRole("img", { name: "Launch rehearsal clip preview" })).toBeVisible();
    await expect(canvas.getByRole("list", { name: "Recent comments" })).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: "Unlike 128" })[0]).toBeVisible();
  },
};
