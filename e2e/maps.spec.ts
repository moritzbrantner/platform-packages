import { expect, test, type Page } from "@playwright/test";

const MAP_CANVAS_LABEL = "Clustered delivery demand map";
const CLUSTER_MARKER_SELECTOR = ".mb-maps__cluster-marker";
const POINT_MARKER_SELECTOR = ".mb-maps__point-marker";

test.beforeEach(async ({ page }) => {
  await page.goto("/maps.html?e2e=1");
  await page.waitForSelector(`[aria-label="${MAP_CANVAS_LABEL}"][data-map-ready="true"]`);
  await page.waitForFunction(() => {
    const handle = (window as WindowWithMapHandle).__MB_MAPS_E2E__;

    return Boolean(handle?.map && handle.readyCount >= 1);
  });
  await page.getByLabel(MAP_CANVAS_LABEL).scrollIntoViewIfNeeded();
  await expect(page.getByTestId("metric-visible-points")).toBeVisible();
  await expect.poll(() => getMetricValue(page, "metric-visible-points")).toBeGreaterThan(0);
});

test("keeps a single map instance alive while zooming", async ({ page }) => {
  const initialZoom = await getZoom(page);

  await expect.poll(() => getReadyCount(page)).toBe(1);

  await page
    .getByLabel(MAP_CANVAS_LABEL)
    .getByRole("button", { name: "Zoom in" })
    .click();

  await expect.poll(() => getZoom(page)).toBeGreaterThan(initialZoom + 0.4);
  await expect.poll(() => getReadyCount(page)).toBe(1);
  await expect.poll(() => getMetricValue(page, "metric-visible-points")).toBeGreaterThan(0);
});

test("supports cluster expansion and individual point selection", async ({ page }) => {
  const clusterTarget = await waitForFeatureTarget(page, CLUSTER_MARKER_SELECTOR);
  const zoomBeforeClusterClick = await getZoom(page);

  await page.mouse.click(clusterTarget.x, clusterTarget.y);

  await expect(page.getByText(/Cluster with [\d,]+ points/)).toBeVisible();
  await expect.poll(() => getZoom(page)).toBeGreaterThan(zoomBeforeClusterClick);

  await page.evaluate(() => {
    const handle = (window as WindowWithMapHandle).__MB_MAPS_E2E__;

    handle?.map.stop();
    handle?.map.setView([40.7128, -74.006], 13, { animate: false });
    handle?.map.fire("moveend");
  });
  await expect.poll(() => getZoom(page)).toBeGreaterThan(12);

  const pointTarget = await waitForFeatureTarget(page, POINT_MARKER_SELECTOR);

  await page.mouse.click(pointTarget.x, pointTarget.y);

  await expect(page.getByText(/Shipment \d+/)).toBeVisible();
  await expect(page.getByText(/orders, \$\d[\d,]* revenue\./)).toBeVisible();
});

async function getZoom(page: Page) {
  return page.evaluate(() => {
    const handle = (window as WindowWithMapHandle).__MB_MAPS_E2E__;

    return handle?.map.getZoom() ?? 0;
  });
}

async function getReadyCount(page: Page) {
  return page.evaluate(() => {
    return (window as WindowWithMapHandle).__MB_MAPS_E2E__?.readyCount ?? 0;
  });
}

async function waitForFeatureTarget(page: Page, selector: string) {
  await page.getByLabel(MAP_CANVAS_LABEL).scrollIntoViewIfNeeded();
  await page.waitForSelector(selector, {
    state: "visible",
  });
  await expect.poll(() => getFeatureTarget(page, selector)).not.toBeNull();

  const target = await getFeatureTarget(page, selector);

  if (!target) {
    throw new Error(`Could not find a clickable feature for selector ${selector}.`);
  }

  return target;
}

async function getMetricValue(page: Page, testId: string) {
  const rawValue = await page.getByTestId(testId).textContent();

  return Number.parseInt((rawValue ?? "").replace(/[^\d]/g, ""), 10) || 0;
}

async function getFeatureTarget(page: Page, selector: string) {
  return page.evaluate(({ mapLabel, targetSelector }) => {
    const mapRegion = document.querySelector(`[aria-label="${mapLabel}"]`);
    const markers = Array.from(
      mapRegion?.querySelectorAll<SVGElement>(targetSelector) ?? [],
    );

    for (const marker of markers) {
      const rect = marker.getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0) {
        continue;
      }

      if (
        rect.left > 48 &&
        rect.top > 48 &&
        rect.right < window.innerWidth - 48 &&
        rect.bottom < window.innerHeight - 48
      ) {
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
    }

    return null;
  }, { mapLabel: MAP_CANVAS_LABEL, targetSelector: selector });
}

type WindowWithMapHandle = Window & {
  __MB_MAPS_E2E__?: {
    map: {
      getZoom(): number;
      fire(eventName: string): void;
      stop(): void;
      setView(
        center: [number, number],
        zoom: number,
        options?: {
          animate?: boolean;
        },
      ): void;
    };
    readyCount: number;
  };
};
