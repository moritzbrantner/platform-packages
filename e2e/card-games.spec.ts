import { expect, test } from "@playwright/test";

test("renders the card games playground preview and updates the focus card", async ({
  page,
}) => {
  await page.goto("/card-games.html");

  await expect(
    page.getByRole("heading", { name: "Card games package examples" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Player hand" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Draw and discard piles" })).toBeVisible();
  await expect(page.getByLabel("Opening hand")).toBeVisible();

  const selectNightCourier = page.getByRole("button", { name: "Select Night courier" });

  await selectNightCourier.evaluate((element: HTMLButtonElement) => {
    element.click();
  });

  await expect(
    page.getByRole("heading", { name: "Night courier", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Platform deck").first()).toBeVisible();
});
