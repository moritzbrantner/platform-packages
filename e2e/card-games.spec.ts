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
  await expect(page.getByLabel("Player hand")).toBeVisible();

  const selectNightCourier = page.getByRole("button", { name: "Select Night courier" });

  await selectNightCourier.evaluate((element: HTMLButtonElement) => {
    element.click();
  });

  await expect(
    page.getByRole("heading", { name: "Night courier", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Platform deck").first()).toBeVisible();

  const focusCard = page.getByRole("button", { name: "Play Night courier" });

  await focusCard.click();
  await expect(page.getByText("Played Night courier")).toBeVisible();

  await focusCard.click({ button: "right" });
  await expect(page.getByRole("menuitem", { name: "Play card" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Discard card" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Draw card" }).click();
  await expect(page.getByRole("button", { name: "Select Ember ace" })).toBeVisible();

  await page.getByRole("button", { name: "Vanguard field slot" }).click();
  await expect(page.getByRole("button", { name: "Vanguard field slot" })).toContainText(
    "Ember ace",
  );

  const discardZone = page.getByRole("button", { name: "Discard selected card" });

  await discardZone.click();
  await expect(discardZone).toContainText("Ember ace");
});
