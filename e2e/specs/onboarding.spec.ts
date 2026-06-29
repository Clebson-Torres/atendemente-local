import { test as base, expect, type Page } from "@playwright/test";
import { createTestUser, type TestUser } from "../fixtures/auth";

const API = "http://localhost:3001/api";

/**
 * Onboarding fixture: creates a user with onboarding_completed=false
 * and provides a page with injected token.
 */
const test = base.extend<{ newUser: TestUser; onboardingPage: Page }>({
  newUser: [
    async ({}, use) => {
      const user = await createTestUser();
      await use(user);
    },
    { scope: "test", timeout: 30000 },
  ],
  onboardingPage: [
    async ({ page, newUser }, use) => {
      await page.addInitScript(`window.__E2E_TOKEN__ = ${JSON.stringify(newUser.token)};`);
      await page.goto("/onboarding");
      await page.waitForSelector("text=Bem-vindo ao AtendeMente", { timeout: 15000 });
      await use(page);
    },
    { scope: "test", timeout: 30000 },
  ],
});

test.describe("Onboarding", () => {
  test("full flow: step 1 → step 2 → skip → dashboard", async ({ onboardingPage }) => {
    // Step 1: Welcome
    await expect(onboardingPage.locator("text=Bem-vindo ao AtendeMente")).toBeVisible();
    await onboardingPage.getByRole("button", { name: /Continuar/i }).click();

    // Step 2: Recovery Secret
    await onboardingPage.waitForSelector("text=Chave de Recuperação", { timeout: 5000 });
    await expect(onboardingPage.locator("text=Salvei meu código")).toBeVisible();

    // Continue disabled until checkbox
    const continueBtn = onboardingPage.getByRole("button", { name: /Continuar/i });
    await expect(continueBtn).toBeDisabled();

    // Check checkbox
    await onboardingPage.locator('input[type="checkbox"]').check();
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // Step 3: Backup Ready
    await onboardingPage.waitForSelector("text=Backup de Segurança", { timeout: 5000 });

    // Skip backup — set up dialog handler BEFORE clicking
    onboardingPage.on("dialog", (dialog) => dialog.accept());
    const skipBtn = onboardingPage.getByRole("button", { name: /Pular/i });
    await skipBtn.click();

    // Confirmation screen
    await onboardingPage.waitForSelector("text=Tudo pronto!", { timeout: 5000 });

    // Enter dashboard
    await onboardingPage.getByRole("button", { name: /Entrar no AtendeMente/i }).click();
    await onboardingPage.waitForSelector("text=Visão geral", { timeout: 15000 });
  });

  test("step 2: copy recovery secret to clipboard", async ({ onboardingPage }) => {
    await onboardingPage.getByRole("button", { name: /Continuar/i }).click();
    await onboardingPage.waitForSelector("text=Chave de Recuperação", { timeout: 5000 });

    const copyBtn = onboardingPage.getByRole("button", { name: /Copiar/i });
    await copyBtn.click();

    await expect(onboardingPage.locator("text=Copiado").first()).toBeVisible({ timeout: 3000 });
  });

  test("step 2: download recovery JSON", async ({ onboardingPage }) => {
    await onboardingPage.getByRole("button", { name: /Continuar/i }).click();
    await onboardingPage.waitForSelector("text=Chave de Recuperação", { timeout: 5000 });

    const [download] = await Promise.all([
      onboardingPage.waitForEvent("download"),
      onboardingPage.getByRole("button", { name: /Baixar/i }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/atendemente-recovery-.*\.json/);
  });

  test("step 2: continue disabled until checkbox", async ({ onboardingPage }) => {
    await onboardingPage.getByRole("button", { name: /Continuar/i }).click();
    await onboardingPage.waitForSelector("text=Chave de Recuperação", { timeout: 5000 });

    const continueBtn = onboardingPage.getByRole("button", { name: /Continuar/i }).last();
    await expect(continueBtn).toBeDisabled();

    await onboardingPage.locator('input[type="checkbox"]').check();
    await expect(continueBtn).toBeEnabled();

    await onboardingPage.locator('input[type="checkbox"]').uncheck();
    await expect(continueBtn).toBeDisabled();
  });

  test("step 3: skip backup shows confirmation", async ({ onboardingPage }) => {
    await onboardingPage.getByRole("button", { name: /Continuar/i }).click();
    await onboardingPage.waitForSelector("text=Chave de Recuperação", { timeout: 5000 });

    await onboardingPage.locator('input[type="checkbox"]').check();
    await onboardingPage.getByRole("button", { name: /Continuar/i }).last().click();

    await onboardingPage.waitForSelector("text=Backup de Segurança", { timeout: 5000 });

    onboardingPage.on("dialog", (dialog) => dialog.accept());
    await onboardingPage.getByRole("button", { name: /Pular/i }).click();
    await onboardingPage.waitForTimeout(500);

    await expect(onboardingPage.locator("text=Tudo pronto!")).toBeVisible({ timeout: 5000 });
  });

  test("step 3: skip cancel keeps on step 3", async ({ onboardingPage }) => {
    await onboardingPage.getByRole("button", { name: /Continuar/i }).click();
    await onboardingPage.waitForSelector("text=Chave de Recuperação", { timeout: 5000 });

    await onboardingPage.locator('input[type="checkbox"]').check();
    await onboardingPage.getByRole("button", { name: /Continuar/i }).last().click();

    await onboardingPage.waitForSelector("text=Backup de Segurança", { timeout: 5000 });

    onboardingPage.on("dialog", (dialog) => dialog.dismiss());
    await onboardingPage.getByRole("button", { name: /Pular/i }).click();
    await onboardingPage.waitForTimeout(500);

    await expect(onboardingPage.locator("text=Backup de Segurança")).toBeVisible();
  });

  test("already onboarded user redirects to dashboard", async ({ page }) => {
    const user = await createTestUser();
    // Complete onboarding via API
    await fetch(`${API}/auth/onboarding`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    });

    await page.addInitScript(`window.__E2E_TOKEN__ = ${JSON.stringify(user.token)};`);
    await page.goto("/onboarding");
    await page.waitForURL((url) => !url.pathname.includes("/onboarding"), { timeout: 15000 });
    await page.waitForSelector("text=Visão geral", { timeout: 15000 });
  });

  test("not logged in redirects to login", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForURL((url) => url.pathname.includes("/login"), { timeout: 15000 });
  });
});
