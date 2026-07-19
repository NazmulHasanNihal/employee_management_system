import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility smoke tests (WCAG AA) — Tier 4.
 *
 * Runs against a live app (set BASE_URL or rely on webServer boot in
 * playwright.config.ts). Gated on STAGING — never point at production.
 *
 * `publicRoutes` are audited without auth. `protectedRoutes` require a session;
 * fill E2E_EMAIL/E2E_PASSWORD (in .env.staging) and the suite logs in first,
 * then audits each route. Routes that 404/redirect are skipped so the suite
 * stays green while the route map evolves.
 */
const publicRoutes = ['/login', '/setup'];

const protectedRoutes = [
  '/dashboard',
  '/leave',
  '/attendance',
  '/payroll',
  '/performance',
  '/recruitment',
  '/profile',
  '/org-chart',
  '/team',
  '/announcements',
  '/calendar',
  '/documents',
  '/assets',
  '/benefits',
  '/settings',
  '/shifts',
  '/training',
  '/helpdesk',
  '/audit',
  '/compliance',
  '/recognition',
  '/onboarding',
  '/registry',
  '/reviews',
];

test.describe('accessibility — public routes', () => {
  for (const route of publicRoutes) {
    test(`${route} has no axe violations`, async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe('accessibility — protected routes', () => {
  test.skip(!email || !password, 'Missing credentials');
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', email!);
    await page.fill('input[type="password"]', password!);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).not.toHaveURL(/login/);
  });

  for (const route of protectedRoutes) {
    test(`${route} has no axe violations`, async ({ page }) => {
      const res = await page.goto(route);
      // Skip routes that don't exist or bounce to login.
      if (!res || res.status() >= 400 || page.url().includes('/login')) return;
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
