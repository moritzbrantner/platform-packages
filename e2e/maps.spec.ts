import { expect, test, type Page } from "@playwright/test";

const MAP_CANVAS_LABEL = "Clustered delivery demand map";
const CLUSTER_LAYER_ID = "moritzbrantner-maps-clusters";
const POINT_LAYER_ID = "moritzbrantner-maps-points";

test.beforeEach(async ({ page }) => {
  await page.goto("/maps.html?e2e=1");
  await page.waitForSelector(`[aria-label="${MAP_CANVAS_LABEL}"][data-map-ready="true"]`);
  await page.waitForFunction(() => {
    const handle = (window as WindowWithMapHandle).__MB_MAPS_E2E__;

    return Boolean(handle?.map && handle.readyCount >= 1);
  });
  await expect(page.getByTestId("metric-visible-points")).toBeVisible();
  await expect.poll(() => getMetricValue(page, "metric-visible-points")).toBeGreaterThan(0);
});

test("keeps a single map instance alive while zooming", async ({ page }) => {
  const initialZoom = await getZoom(page);

  await expect.poll(() => getReadyCount(page)).toBe(1);

  await page.getByRole("button", { name: "Zoom in" }).click();

  await expect.poll(() => getZoom(page)).toBeGreaterThan(initialZoom + 0.4);
  await expect.poll(() => getReadyCount(page)).toBe(1);
  await expect.poll(() => getMetricValue(page, "metric-visible-points")).toBeGreaterThan(0);
});

test("supports cluster expansion and individual point selection", async ({ page }) => {
  const clusterTarget = await waitForFeatureTarget(page, CLUSTER_LAYER_ID);
  const zoomBeforeClusterClick = await getZoom(page);

  await page.mouse.click(clusterTarget.x, clusterTarget.y);

  await expect(page.getByText(/Cluster with [\d,]+ points/)).toBeVisible();
  await expect.poll(() => getZoom(page)).toBeGreaterThan(zoomBeforeClusterClick);

  await page.evaluate(() => {
    const handle = (window as WindowWithMapHandle).__MB_MAPS_E2E__;

    handle?.map.jumpTo({
      center: [-74.006, 40.7128],
      zoom: 11.5,
    });
  });

  const pointTarget = await waitForFeatureTarget(page, POINT_LAYER_ID);

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

async function waitForFeatureTarget(page: Page, layerId: string) {
  await page.waitForFunction((targetLayerId) => {
    const handle = (window as WindowWithMapHandle).__MB_MAPS_E2E__;

    if (!handle?.map) {
      return false;
    }

    const features = handle.map.queryRenderedFeatures(undefined, {
      layers: [targetLayerId],
    });

    return features.length > 0;
  }, layerId);

  await expect.poll(() => getFeatureTarget(page, layerId)).not.toBeNull();

  const target = await getFeatureTarget(page, layerId);

  if (!target) {
    throw new Error(`Could not find a clickable feature for layer ${layerId}.`);
  }

  return target;
}

async function getMetricValue(page: Page, testId: string) {
  const rawValue = await page.getByTestId(testId).textContent();

  return Number.parseInt((rawValue ?? "").replace(/[^\d]/g, ""), 10) || 0;
}

async function getFeatureTarget(page: Page, layerId: string) {
  return page.evaluate((targetLayerId) => {
    const handle = (window as WindowWithMapHandle).__MB_MAPS_E2E__;
    const map = handle?.map;

    if (!map) {
      return null;
    }

    const canvas = map.getCanvas();
    const canvasRect = canvas.getBoundingClientRect();
    const features = map.queryRenderedFeatures(undefined, {
      layers: [targetLayerId],
    });

    for (const feature of features) {
      if (feature.geometry.type !== "Point") {
        continue;
      }

      const [longitude, latitude] = feature.geometry.coordinates;
      const projectedPoint = map.project([longitude, latitude]);

      if (
        projectedPoint.x > 48 &&
        projectedPoint.x < canvasRect.width - 48 &&
        projectedPoint.y > 48 &&
        projectedPoint.y < canvasRect.height - 48
      ) {
        return {
          x: canvasRect.left + projectedPoint.x,
          y: canvasRect.top + projectedPoint.y,
        };
      }
    }

    return null;
  }, layerId);
}

type WindowWithMapHandle = Window & {
  __MB_MAPS_E2E__?: {
    map: {
      getCanvas(): HTMLCanvasElement;
      getZoom(): number;
      jumpTo(options: {
        center: [number, number];
        zoom: number;
      }): void;
      project(lngLat: [number, number]): {
        x: number;
        y: number;
      };
      queryRenderedFeatures(
        geometry?: unknown,
        options?: {
          layers?: string[];
        },
      ): Array<{
        geometry:
          | {
              type: "Point";
              coordinates: [number, number];
            }
          | {
              type: string;
            };
      }>;
    };
    readyCount: number;
  };
};
