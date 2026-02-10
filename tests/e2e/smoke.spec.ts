import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/');

    // Verify the page loaded with a success status
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
  });

  test('homepage contains Apiculture in the title or body', async ({ page }) => {
    await page.goto('/');

    // Check the page title or visible text for "Apiculture"
    const title = await page.title();
    const bodyText = await page.textContent('body');

    const hasApicultureInTitle = title.toLowerCase().includes('apiculture');
    const hasApicultureInBody = (bodyText ?? '').toLowerCase().includes('apiculture');

    expect(hasApicultureInTitle || hasApicultureInBody).toBe(true);
  });

  test('homepage has no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known benign errors (e.g., missing favicon)
    const criticalErrors = consoleErrors.filter((error) => !error.includes('favicon'));

    expect(criticalErrors).toHaveLength(0);
  });

  test('navigation is present', async ({ page }) => {
    await page.goto('/');

    // Verify some form of navigation exists
    const nav = page.locator('nav, header, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
  });
});
