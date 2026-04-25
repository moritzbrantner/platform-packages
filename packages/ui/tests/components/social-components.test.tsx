import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, test, vi } from "vitest";

import {
  ChatBox,
  ChatBoxBody,
  ChatBoxBubble,
  ChatBoxHeader,
  ChatBoxMessage,
  ChatBoxMeta,
  ChatBoxTitle,
  FollowButton,
  ImageFilterEditor,
  LikeButton,
  ProfileSummary,
  ProfileSummaryActions,
  ProfileSummaryAvatar,
  ProfileSummaryContent,
  ProfileSummaryDescription,
  ProfileSummaryHeader,
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
} from "../../src";

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
        <ShareButton count="4" />
        <FollowButton following />
      </SocialActionGroup>,
    );

    expect(screen.getByRole("button", { name: "Unlike 12" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "Share 4" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Following" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
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
    expect(container.querySelector("[data-slot='image-filter-image']")?.getAttribute("style")).toContain(
      "brightness(120%)",
    );
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
