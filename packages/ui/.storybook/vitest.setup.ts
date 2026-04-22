import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/react-vite";

import * as previewAnnotations from "./preview";

// The Storybook 10.3 automatic addon-vitest annotations do not currently
// resolve in this Bun workspace, so keep explicit project annotations here.
setProjectAnnotations([a11yAddonAnnotations, previewAnnotations]);
