import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, test, vi } from "vitest";

import {
  Button,
  ChatBox,
  ChatBoxBody,
  ChatBoxBubble,
  ChatBoxHeader,
  ChatBoxMessage,
  ChatBoxMeta,
  ChatBoxTitle,
  CommentButton,
  FollowButton,
  ImageFilterEditor,
  LikeButton,
  ProfileSummary,
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
  ProfileSummaryActions,
  ProfileSummaryAvatar,
  ProfileSummaryContent,
  ProfileSummaryDescription,
  ProfileSummaryHeader,
  SocialPost,
  SocialPostAuthor,
  SocialPostAvatar,
  SocialPostBody,
  SocialPostFooter,
  SocialPostHeader,
  SocialPostMedia,
  SocialPostMeta,
  SocialPostMetrics,
  SocialPostText,
  SocialPostTitle,
  ProfileSummaryStat,
  ProfileSummaryStatLabel,
  ProfileSummaryStatValue,
  ProfileSummaryStats,
  ProfileSummaryTitle,
  ShareButton,
  SocialActionGroup,
  getImageFilterStyle,
  imageFilterPresets,
  normalizeImageFilterValue,
  type ImageFilterValue,
} from "..";

const filteredValue: ImageFilterValue = {
  brightness: 120,
  contrast: 110,
  grayscale: 10,
  hueRotate: 8,
  saturate: 130,
  sepia: 12,
};

describe("social components", () => {
  test("renders social action buttons with counts and pressed states", () => {
    render(
      <SocialActionGroup>
        <LikeButton liked count={12} />
        <CommentButton commented count={8} />
        <ShareButton count="4" />
        <FollowButton following />
      </SocialActionGroup>,
    );

    expect(screen.getByRole("button", { name: "Unlike 12" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "Comment 8" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "Share 4" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Following" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  test("renders a social post with comments and a composer workflow", () => {
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());

    render(
      <div className="grid gap-4">
        <SocialComposer onSubmit={onSubmit}>
          <SocialComposerHeader>
            <span>Share an update</span>
          </SocialComposerHeader>
          <SocialComposerTextarea aria-label="Post draft" defaultValue="Studio update." />
          <SocialComposerToolbar>
            <span className="text-xs text-muted-foreground">Posting to launch review</span>
            <SocialComposerActions>
              <Button type="submit" size="sm">
                Publish update
              </Button>
            </SocialComposerActions>
          </SocialComposerToolbar>
        </SocialComposer>

        <SocialPost featured>
          <SocialPostHeader>
            <SocialPostAvatar name="Ada Lovelace" online />
            <SocialPostAuthor>
              <SocialPostTitle>Ada Lovelace</SocialPostTitle>
              <SocialPostMeta>
                <span>Systems author</span>
                <span>Today</span>
              </SocialPostMeta>
            </SocialPostAuthor>
          </SocialPostHeader>
          <SocialPostBody>
            <SocialPostText>Analytical engines, now with social replies.</SocialPostText>
            <SocialPostMedia>
              <img src="preview.png" alt="Post preview" />
            </SocialPostMedia>
          </SocialPostBody>
          <SocialPostFooter>
            <SocialPostMetrics>
              <span>42 likes</span>
              <span>3 comments</span>
            </SocialPostMetrics>
            <SocialActionGroup>
              <LikeButton count={42} />
              <CommentButton count={3} />
              <ShareButton count={2} />
            </SocialActionGroup>
            <SocialCommentList aria-label="Thread replies">
              <SocialComment>
                <SocialCommentAvatar name="Grace Hopper" />
                <SocialCommentContent>
                  <SocialCommentMeta>
                    <span>Grace Hopper</span>
                    <span>now</span>
                  </SocialCommentMeta>
                  <SocialCommentText>Looks ready for the review deck.</SocialCommentText>
                  <SocialCommentActions>
                    <Button type="button" variant="link" size="xs" className="h-auto px-0 py-0">
                      Reply
                    </Button>
                  </SocialCommentActions>
                </SocialCommentContent>
              </SocialComment>
            </SocialCommentList>
          </SocialPostFooter>
        </SocialPost>
      </div>,
    );

    expect(screen.getByRole("button", { name: "Publish update" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Post preview" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Thread replies" })).toBeTruthy();
    expect(screen.getByText("42 likes")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Publish update" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("renders a summarized profile with stats and actions", () => {
    render(
      <ProfileSummary>
        <ProfileSummaryAvatar name="Ada Lovelace" online />
        <ProfileSummaryContent>
          <ProfileSummaryHeader>
            <ProfileSummaryTitle>Ada Lovelace</ProfileSummaryTitle>
            <ProfileSummaryActions>
              <FollowButton aria-label="Follow Ada Lovelace" />
            </ProfileSummaryActions>
          </ProfileSummaryHeader>
          <ProfileSummaryDescription>
            Writes notes about analytical engines.
          </ProfileSummaryDescription>
          <ProfileSummaryStats>
            <ProfileSummaryStat>
              <ProfileSummaryStatLabel>Followers</ProfileSummaryStatLabel>
              <ProfileSummaryStatValue>42k</ProfileSummaryStatValue>
            </ProfileSummaryStat>
          </ProfileSummaryStats>
        </ProfileSummaryContent>
      </ProfileSummary>,
    );

    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
    expect(screen.getByText("AL")).toBeTruthy();
    expect(screen.getByText("42k")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Follow Ada Lovelace" })).toBeTruthy();
  });

  test("renders a chat box as a live log with aligned messages", () => {
    const { container } = render(
      <ChatBox>
        <ChatBoxHeader>
          <ChatBoxTitle>Project chat</ChatBoxTitle>
        </ChatBoxHeader>
        <ChatBoxBody>
          <ChatBoxMessage>
            <ChatBoxMeta>Mira, 09:30</ChatBoxMeta>
            <ChatBoxBubble>Ready for review.</ChatBoxBubble>
          </ChatBoxMessage>
          <ChatBoxMessage align="end">
            <ChatBoxMeta>You, now</ChatBoxMeta>
            <ChatBoxBubble>Looks good.</ChatBoxBubble>
          </ChatBoxMessage>
        </ChatBoxBody>
      </ChatBox>,
    );

    expect(screen.getByRole("log")).toBeTruthy();
    expect(screen.getByText("Project chat")).toBeTruthy();
    expect(screen.getByText("Looks good.")).toBeTruthy();
    expect(container.querySelector("[data-align='end']")).toBeTruthy();
  });

  test("applies image filter presets and exposes filter helpers", () => {
    const onValueChange = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        disconnect() {}
        observe() {}
        unobserve() {}
      },
    );
    const { container } = render(
      <ImageFilterEditor
        src="profile.png"
        alt="Profile upload"
        value={filteredValue}
        onValueChange={onValueChange}
      />,
    );

    expect(screen.getByAltText("Profile upload")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='image-filter-image']")?.getAttribute("style"),
    ).toContain("brightness(120%)");
    expect(getImageFilterStyle({ brightness: 250, hueRotate: -220 })).toContain("brightness(200%)");
    expect(normalizeImageFilterValue({ grayscale: 250 }).grayscale).toBe(100);
    expect(screen.getByText("Custom mix")).toBeTruthy();
    expect(screen.getByText("6 adjustments")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Mono" }));
    expect(onValueChange).toHaveBeenCalledWith(imageFilterPresets[2].value);

    fireEvent.click(screen.getByRole("button", { name: "Show compare preview" }));
    expect(screen.getByText("Before / After")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onValueChange).toHaveBeenCalledWith(imageFilterPresets[0].value);
  });
});
