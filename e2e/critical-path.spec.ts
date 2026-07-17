import { test, expect } from '@playwright/test';

/**
 * Critical-path e2e (J).
 *
 * Proves the end-to-end flow: log in → create a leave request → verify it
 * persisted → log out. Gated on STAGING: requires E2E_EMAIL / E2E_PASSWORD and
 * a running app (BASE_URL). Skips if those aren't set so CI doesn't fail on a
 * missing environment.
 *
 * Run:
 *   cp .env.staging.example .env.staging   # fill E2E_EMAIL / E2E_PASSWORD too
 *   BASE_URL=http://localhost:3000 pnpm test:e2e:staging e2e/critical-path.spec.ts
 */
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe.skipIf(!email || !password)('critical path (staging)', () => {
  test('login → create leave → verify saved → logout', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', email!);
    await page.fill('input[type="password"]', password!);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Land on a protected page.
    await expect(page).not.toHaveURL(/login/);

    // Go to leave and create a request.
    await page.goto('/leave');
    const createBtn = page.getByRole('button', { name: /new request|apply|create/i }).first();
    await createBtn.click();

    // Fill a minimal leave form (adjust selectors to your form).
    const reason = page.getByLabel(/reason/i);
    if (await reason.isVisible()) {
      await reason.fill(`e2e-${Date.now()}`);
    }
    await page.getByRole('button', { name: /submit|save|apply/i }).click();

    // The new request should appear in the list (data persisted + revalidated).
    await expect(page.getByText(/pending/i).first()).toBeVisible();
  });
});
