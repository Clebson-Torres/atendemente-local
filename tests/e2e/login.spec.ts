import { expect, test } from "@playwright/test";

test("renders login experience", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "AtendeMente" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});
