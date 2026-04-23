import { expect, test } from "@playwright/test";

test("renders the card games playground preview and updates the focus card", async ({ page }) => {
  await page.goto("/card-games.html");

  await expect(page.getByRole("heading", { name: "Card games package examples" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Player hand" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Draw and discard piles" })).toBeVisible();
  await expect(page.getByLabel("Player hand")).toBeVisible();

  const selectNightCourier = page.getByRole("button", { name: "Select Night courier" });

  await selectNightCourier.evaluate((element: HTMLButtonElement) => {
    element.click();
  });

  await expect(page.getByRole("heading", { name: "Night courier", exact: true })).toBeVisible();
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

  const vanguardSlot = page.getByRole("button", { name: "Vanguard field slot" });

  await vanguardSlot.click({ button: "right" });
  await expect(page.getByRole("menuitem", { name: "Inspect card" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Return to hand" })).toBeVisible();

  await page.getByRole("menuitem", { name: "Inspect card" }).click();
  await expect(page.getByRole("dialog")).toContainText("Rules text");
  await expect(page.getByRole("heading", { name: "Ember ace", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  await vanguardSlot.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Return to hand" }).click();
  const returnedCard = page.getByRole("button", { name: "Select Ember ace" });

  await expect(returnedCard).toBeVisible();
  await returnedCard.click();
  await vanguardSlot.click();
  await expect(vanguardSlot).toContainText("Ember ace");

  const discardZone = page.getByRole("button", { name: "Discard selected card" });

  await discardZone.click();
  await expect(discardZone).toContainText("Ember ace");
});

test("keeps playing-field cards inside their slots", async ({ page }) => {
  await page.goto("/card-games.html");

  await page.getByRole("button", { name: "Draw card" }).click();
  await page.getByRole("button", { name: "Vanguard field slot" }).click();
  await page.getByRole("button", { name: "Draw card" }).click();
  await page.getByRole("button", { name: "Support field slot" }).click();
  await page.getByRole("button", { name: "Draw card" }).click();
  await page.getByRole("button", { name: "Reserve field slot" }).click();

  const cardsFitSlots = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('[aria-label$="field slot"]')).map(
      (slot) => {
        const card = slot.querySelector<HTMLElement>(".mb-playing-card");

        if (!card) return false;

        const slotRect = slot.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();

        return cardRect.left >= slotRect.left - 1 && cardRect.right <= slotRect.right + 1;
      },
    ),
  );

  expect(cardsFitSlots).toEqual([true, true, true]);
});
