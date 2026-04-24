import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, test, vi } from "vitest";

import {
  Avatar,
  AvatarBadge,
  AvatarCollection,
  AvatarCollectionCount,
  AvatarFallback,
  ImageCropper,
  getAvatarInitials,
  getImageCropArea,
  type ImageCropperCrop,
} from "../../src";

describe("avatar", () => {
  test("renders single-user avatars and avatar collections with shape variants", () => {
    render(
      <>
        <Avatar size="xl" shape="round">
          <AvatarFallback name="Mira Brandt" />
          <AvatarBadge />
        </Avatar>
        <AvatarCollection>
          <Avatar size="xl" shape="hexagonal">
            <AvatarFallback name="Platform Design" />
          </Avatar>
          <AvatarCollectionCount shape="square">+4</AvatarCollectionCount>
        </AvatarCollection>
      </>,
    );

    expect(screen.getByText("MB")).toBeTruthy();
    expect(screen.getByText("PD")).toBeTruthy();
    expect(screen.getByText("+4")).toBeTruthy();
    expect(screen.getByText("MB").closest('[data-slot="avatar"]')?.getAttribute("data-shape")).toBe(
      "round",
    );
    expect(screen.getByText("PD").closest('[data-slot="avatar"]')?.getAttribute("data-shape")).toBe(
      "hexagonal",
    );
    expect(
      screen
        .getByText("+4")
        .closest('[data-slot="avatar-collection-count"]')
        ?.getAttribute("data-shape"),
    ).toBe("square");
  });

  test("creates initials from names", () => {
    expect(getAvatarInitials("Ada Lovelace")).toBe("AL");
    expect(getAvatarInitials("  single  ")).toBe("S");
    expect(getAvatarInitials("", { fallback: "NA" })).toBe("NA");
    expect(getAvatarInitials("Grace Brewster Hopper", { maxInitials: 3 })).toBe("GBH");
  });
});

describe("image cropper", () => {
  test("calculates crop area from viewport, image size, pan, and zoom", () => {
    expect(
      getImageCropArea(
        { x: 0, y: 0, zoom: 1 },
        { width: 400, height: 300 },
        { width: 200, height: 200 },
      ),
    ).toEqual({
      height: 300,
      width: 300,
      x: 50,
      y: 0,
    });

    expect(
      getImageCropArea(
        { x: 20, y: 0, zoom: 2 },
        { width: 400, height: 300 },
        { width: 200, height: 200 },
      ),
    ).toEqual({
      height: 150,
      width: 150,
      x: 110,
      y: 75,
    });
  });

  test("renders a keyboard-operable crop surface and reports crop changes", () => {
    const onCropChange = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        disconnect() {}
        observe() {}
        unobserve() {}
      },
    );

    render(
      <ImageCropper
        src="avatar.png"
        alt="Avatar source"
        crop={{ x: 0, y: 0, zoom: 1 }}
        maxZoom={2}
        onCropChange={onCropChange}
      />,
    );

    const cropSurface = screen.getByRole("application", { name: "Crop image" });
    expect(screen.getByAltText("Avatar source")).toBeTruthy();
    expect(screen.getByRole("slider", { name: "Crop zoom" })).toBeTruthy();

    fireEvent.keyDown(cropSurface, { key: "=" });

    expect(onCropChange).toHaveBeenCalledWith({
      x: 0,
      y: 0,
      zoom: 1.1,
    } satisfies ImageCropperCrop);
  });
});
