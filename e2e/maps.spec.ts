import { expect, test, type Page } from "@playwright/test";

const MAP_CANVAS_LABEL = "Clustered delivery demand map";
// Cluster and point markers are canvas-rendered MapLibre layers in current maps; the marker
// class names live on each layer's flat-options metadata instead of on DOM elements.
const CLUSTER_MARKER_CLASS = "mb-maps__cluster-marker";
const POINT_MARKER_CLASS = "mb-maps__point-marker";

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

  await page.getByLabel(MAP_CANVAS_LABEL).getByRole("button", { name: "Zoom in" }).click();

  await expect.poll(() => getZoom(page)).toBeGreaterThan(initialZoom + 0.4);
  await expect.poll(() => getReadyCount(page)).toBe(1);
  await expect.poll(() => getMetricValue(page, "metric-visible-points")).toBeGreaterThan(0);
});

test("supports cluster expansion and individual point selection", async ({ page }) => {
  const clusterTarget = await waitForFeatureTarget(page, CLUSTER_MARKER_CLASS);
  const zoomBeforeClusterClick = await getZoom(page);

  await page.mouse.click(clusterTarget.x, clusterTarget.y);

  await expect(page.getByText(/Cluster with [\d,]+ points/)).toBeVisible();
  await expect.poll(() => getZoom(page)).toBeGreaterThan(zoomBeforeClusterClick);

  await page.evaluate(() => {
    const handle = (window as WindowWithMapHandle).__MB_MAPS_E2E__;

    handle?.map.stop();
    // MapLibre equivalent of Leaflet's non-animated setView([lat, lng], zoom); jumpTo emits
    // moveend itself.
    handle?.map.jumpTo({ center: [-74.006, 40.7128], zoom: 13 });
  });
  await expect.poll(() => getZoom(page)).toBeGreaterThan(12);

  const pointTarget = await waitForFeatureTarget(page, POINT_MARKER_CLASS);

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

async function waitForFeatureTarget(page: Page, markerClass: string) {
  await page.getByLabel(MAP_CANVAS_LABEL).scrollIntoViewIfNeeded();
  await expect.poll(() => getFeatureTarget(page, markerClass)).not.toBeNull();

  const target = await getFeatureTarget(page, markerClass);

  if (!target) {
    throw new Error(`Could not find a clickable feature for marker class ${markerClass}.`);
  }

  return target;
}

async function getMetricValue(page: Page, testId: string) {
  const rawValue = await page.getByTestId(testId).textContent();

  return Number.parseInt((rawValue ?? "").replace(/[^\d]/g, ""), 10) || 0;
}

async function getFeatureTarget(page: Page, markerClass: string) {
  return page.evaluate((className) => {
    const map = (window as WindowWithMapHandle).__MB_MAPS_E2E__?.map;

    if (!map) {
      return null;
    }

    const canvas = map.getCanvas().getBoundingClientRect();

    for (const feature of map.queryRenderedFeatures()) {
      const classes = feature.layer?.metadata?.flatOptions?.className ?? "";

      if (!classes.split(/\s+/).includes(className) || feature.geometry.type !== "Point") {
        continue;
      }

      const projected = map.project(feature.geometry.coordinates as [number, number]);
      const x = canvas.left + projected.x;
      const y = canvas.top + projected.y;

      if (
        x > Math.max(48, canvas.left + 24) &&
        y > Math.max(48, canvas.top + 24) &&
        x < Math.min(window.innerWidth - 48, canvas.right - 24) &&
        y < Math.min(window.innerHeight - 48, canvas.bottom - 24)
      ) {
        return { x, y };
      }
    }

    return null;
  }, markerClass);
}

type WindowWithMapHandle = Window & {
  __MB_MAPS_E2E__?: {
    // The MapLibre map handed to onMapReady by maps' default flat runtime.
    map: {
      getCanvas(): HTMLCanvasElement;
      getZoom(): number;
      jumpTo(options: { center: [number, number]; zoom: number }): void;
      project(lngLat: [number, number]): { x: number; y: number };
      queryRenderedFeatures(): Array<{
        geometry: { coordinates: unknown; type: string };
        layer?: { metadata?: { flatOptions?: { className?: string } } };
      }>;
      stop(): void;
    };
    readyCount: number;
  };
};
