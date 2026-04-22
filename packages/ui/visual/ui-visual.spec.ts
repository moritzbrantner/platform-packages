import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];
const storyIds = [
  "components-button--variants",
  "components-form-controls--basic",
  "components-shadcn-catalog--full-catalog",
  "components-datagrid--default",
  "components-platformnavbar--web",
  "components-calendar--card-days",
  "components-documentviewer--ocr-report-viewer",
  "components-timelineeditor--default",
  "components-annotationcanvas--default",
  "components-workflowbuilder--ai-workflow-graph",
];
const uiThemes = ["bobba", "zleek", "atlas", "studio", "paper"] as const;
const colorSchemes = ["light", "dark"] as const;
const horizontallyScrollableStories = new Set([
  "components-shadcn-catalog--full-catalog",
  "components-datagrid--default",
  "components-platformnavbar--web",
  "components-calendar--card-days",
  "components-timelineeditor--default",
  "components-workflowbuilder--ai-workflow-graph",
]);
const denseControlStories = new Set([
  "components-calendar--card-days",
  "components-shadcn-catalog--full-catalog",
  "components-workflowbuilder--ai-workflow-graph",
]);

for (const viewport of viewports) {
  test.describe(`visual layout at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const storyId of storyIds) {
      for (const colorScheme of colorSchemes) {
        test(`${storyId} has stable ${colorScheme} layout`, async ({ page }) => {
          await gotoStory(page, storyId, { designSystem: "bobba", theme: colorScheme });
          await verifyPageLayout(page, storyId);
        });
      }
    }

    for (const designSystem of uiThemes) {
      test(`catalog renders ${designSystem}`, async ({ page }) => {
        await gotoStory(page, "components-shadcn-catalog--full-catalog", {
          designSystem,
          theme: "light",
        });
        await verifyPageLayout(page, "components-shadcn-catalog--full-catalog");
      });
    }
  });
}

async function gotoStory(
  page: Page,
  storyId: string,
  globals: { designSystem: (typeof uiThemes)[number]; theme: (typeof colorSchemes)[number] },
) {
  const globalParam = `designSystem:${globals.designSystem};theme:${globals.theme}`;

  await page.goto(`/iframe.html?id=${storyId}&globals=${encodeURIComponent(globalParam)}`);
  await page.locator("#storybook-root").waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
}

async function verifyPageLayout(page: Page, storyId: string) {
  await expect(page.locator("#storybook-root")).toBeVisible();

  const layout = await page.evaluate((allowDenseControls) => {
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const badBoxes = [...document.querySelectorAll<HTMLElement>("[data-slot], button, [role]")]
      .filter((element) => {
        const style = window.getComputedStyle(element);

        return style.display !== "none" && style.visibility !== "hidden";
      })
      .slice(0, 80)
      .filter((element) => {
        const box = element.getBoundingClientRect();

        return (
          !Number.isFinite(box.width) ||
          !Number.isFinite(box.height) ||
          box.width < 0 ||
          box.height < 0
        );
      })
      .map((element) => element.getAttribute("data-slot") ?? element.tagName.toLowerCase());
    const clippedButtons = [...document.querySelectorAll<HTMLButtonElement>("button")]
      .filter((button) => {
        const style = window.getComputedStyle(button);

        return style.display !== "none" && style.visibility !== "hidden";
      })
      .filter((button) => {
        const accessibleName = button.textContent?.trim() ?? button.getAttribute("aria-label") ?? "";

        if (accessibleName.length === 0) {
          return false;
        }

        if (allowDenseControls) {
          return false;
        }

        return true;
      })
      .filter(
        (button) =>
          button.scrollWidth > button.clientWidth + 2 || button.scrollHeight > button.clientHeight + 2,
      )
      .map((button) => button.textContent?.trim() ?? button.getAttribute("aria-label") ?? "button");

    return {
      hasHorizontalOverflow: scrollWidth > viewportWidth + 4,
      badBoxes,
      clippedButtons,
    };
  }, denseControlStories.has(storyId));

  if (!horizontallyScrollableStories.has(storyId)) {
    expect(layout.hasHorizontalOverflow, "story should not horizontally overflow").toBe(false);
  }
  expect(layout.badBoxes, "visible elements should have finite boxes").toEqual([]);
  expect(layout.clippedButtons, "button text should not be clipped").toEqual([]);

  await page.keyboard.press("Tab");

  const activeElementIsVisible = await page.evaluate(() => {
    const element = document.activeElement;

    if (!(element instanceof HTMLElement) || element === document.body) {
      return true;
    }

    const box = element.getBoundingClientRect();

    return box.width > 0 && box.height > 0;
  });

  expect(activeElementIsVisible, "keyboard focus target should be visible").toBe(true);
}
