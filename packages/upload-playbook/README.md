# @moritzbrantner/upload-playbook

Platform-specific upload UX guidance, lifecycle steps, and file-handling heuristics.

## Main APIs

- `getUploadGuide(platform)` / `getAllUploadGuides()`
- `inferUploadKind(fileName, mimeType?)` / `getUploadManagementHint(kind, sizeInBytes)`
- `uploadTypeGroups`, `uploadLifecycle`, and `mobileUploadPresets`
