import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, test, vi } from "vitest";

import {
  Avatar,
  AvatarCollection,
  ImageCropper,
  getAvatarInitials,
  getImageCropArea,
  type ImageCropperCrop,
} from "..";

describe("avatar", () => {
  test("renders single-user avatars and avatar collections with shape variants", () => {
    const { container } = render(
      <>
        <Avatar size="xl" shape="round" name="Mira Brandt" online />
        <AvatarCollection
          users={[
            { name: "Platform Design", size: "xl", shape: "hexagonal" },
            { name: "Release Crew", size: "xl", shape: "square" },
            { name: "Operations", size: "xl", shape: "round" },
            { name: "Support", size: "xl", shape: "round" },
            { name: "People Ops", size: "xl", shape: "round" },
          ]}
          maxVisible={1}
          overflowShape="hexagonal"
        />
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
    const roundAvatar = screen.getByText("MB").closest('[data-slot="avatar"]') as HTMLElement;
    const hexagonalAvatar = screen.getByText("PD").closest('[data-slot="avatar"]') as HTMLElement;
    const overflowCount = screen
      .getByText("+4")
      .closest('[data-slot="avatar-collection-count"]') as HTMLElement;

    expect(roundAvatar.className).toContain("border");
    expect(roundAvatar.className).toContain("overflow-hidden");
    expect(roundAvatar.style.borderRadius).toBe("9999px");
    expect(hexagonalAvatar.style.clipPath).toContain("polygon(50% 0");
    expect(overflowCount.style.clipPath).toContain("polygon(50% 0");
    expect(container.querySelector('[data-slot="avatar-collection"]')?.className).toContain(
      "*:data-[shape=hexagonal]:ring-0",
    );
    expect(
      screen
        .getByText("+4")
        .closest('[data-slot="avatar-collection-count"]')
        ?.getAttribute("data-shape"),
    ).toBe("hexagonal");
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
    expect(screen.getByText("100% zoom")).toBeTruthy();

    fireEvent.keyDown(cropSurface, { key: "=" });
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    cropSurface.focus();
    fireEvent.wheel(cropSurface, { deltaY: -10 });

    expect(onCropChange).toHaveBeenCalledWith({
      x: 0,
      y: 0,
      zoom: 1.1,
    } satisfies ImageCropperCrop);
    expect(onCropChange).toHaveBeenCalledTimes(3);
  });
});
