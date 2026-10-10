// @moritzbrantner/workflow-editor (every published and git revision up to main 7c67640)
// still targets @moritzbrantner/ui 0.8, whose root barrel exported SearchField. ui 0.9
// moved SearchField to the `@moritzbrantner/ui/data` entry. vite.config.ts resolves
// workflow-editor's root `@moritzbrantner/ui` imports to this module so the editor shares
// the playground's single ui 1.x instance. Delete this file and the resolver once
// workflow-editor imports SearchField from `@moritzbrantner/ui/data` itself.
export * from "@moritzbrantner/ui";
export { SearchField } from "@moritzbrantner/ui/data";
