import { test, expect } from '@playwright/test';
test('@{{APP_PREFIX}}-REQ-001 anonymous action works', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example Domain/);
});
