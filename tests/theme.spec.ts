import { expect, test } from '@playwright/test';
import { themes } from '../src/theme/theme.config';

test('dashboard header and desktop/mobile navigation follow every theme', async ({
  page,
  isMobile,
}) => {
  await page.route('https://api.example.test/**', (route) =>
    route.fulfill({ json: { HasError: false, Result: [], TotalRecords: 0 } }),
  );
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'finova.auth',
      JSON.stringify({
        token: 'test-token',
        username: 'tester',
        displayName: 'Test Partner',
        userTypeId: 1,
        expiresAt: Date.now() + 3600000,
      }),
    );
  });
  await page.goto('/Dashboard/UserDashboard');
  const toggle = page.getByRole('button', { name: 'Toggle navigation' });
  if (!isMobile) {
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeHidden();
    await expect(page.locator('.MuiDrawer-root')).toHaveCSS('width', '0px');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  }
  for (const [name, theme] of Object.entries(themes)) {
    await page.getByLabel('Theme', { exact: true }).selectOption(name);
    const rgb = (hex: string) =>
      `rgb(${hex
        .slice(1)
        .match(/../g)!
        .map((c) => parseInt(c, 16))
        .join(', ')})`;
    await expect(page.locator('.MuiAppBar-root')).toHaveCSS(
      'background-color',
      rgb(theme.navigation.headerBackground),
    );
    if (isMobile) await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await expect(page.locator('.MuiDrawer-paper')).toHaveCSS(
      'background-color',
      rgb(theme.navigation.sidebarBackground),
    );
    await expect(page.getByRole('link', { name: 'Home', exact: true })).toHaveCSS(
      'background-color',
      rgb(theme.navigation.sidebarActiveBackground),
    );
    if (isMobile) await page.getByRole('link', { name: 'Home', exact: true }).click();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('theme selection updates actual styles and survives refresh', async ({ page }) => {
  await page.goto('/login');
  const selector = page.getByLabel('Theme', { exact: true });
  for (const [name, background] of [
    ['dark', 'rgb(16, 25, 35)'],
    ['blue', 'rgb(240, 244, 250)'],
    ['light', 'rgb(244, 247, 250)'],
  ]) {
    await selector.selectOption(name);
    await expect(page.locator('body')).toHaveCSS('background-color', background);
    await expect(page.locator('html')).toHaveAttribute('data-theme', name);
    await page.reload();
    await expect(selector).toHaveValue(name);
    await expect(page.locator('body')).toHaveCSS('background-color', background);
  }
  await expect(page.getByLabel('Username', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
