import { describe, expect, test } from "vitest";

import {
  formatFileSize,
  getAllUploadGuides,
  getUploadGuide,
  getUploadManagementHint,
  inferUploadKind,
} from "@moritzbrantner/upload-playbook";

describe("@moritzbrantner/upload-playbook", () => {
  test("exposes platform upload guides", () => {
    expect(getAllUploadGuides().map((guide) => guide.platform)).toEqual([
      "web",
      "desktop",
      "mobile",
    ]);
    expect(getUploadGuide("desktop").title).toContain("Electron");
  });

  test("infers upload kinds and management hints", () => {
    expect(inferUploadKind("photo.heic")).toBe("image");
    expect(inferUploadKind("rows.csv")).toBe("data");
    expect(inferUploadKind("movie.mp4")).toBe("video");
    expect(getUploadManagementHint("archive", 42).label).toBe("Chunk before transfer");
  });

  test("formats file sizes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
