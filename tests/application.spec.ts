import { expect, test, type Page } from '@playwright/test';
import { pages } from '../src/app/pages';
async function mockApi(
  page: Page,
  menuPaths = pages.filter((p) => p.path.startsWith('/Dashboard/')).map((p) => p.path),
) {
  await page.route('https://api.example.test/**', async (route) => {
    const url = new URL(route.request().url());
    const result =
      url.pathname === '/AA/login'
        ? { HasError: false, UserToken: 'test-user-token', DisplayName: 'Test Partner' }
        : url.pathname === '/User/GetUserMasterDetailsforConfig'
          ? { HasError: false, Result: { UserTypeId: 1, FirstName: 'Test', Usercode: 'tester' } }
          : url.pathname === '/User/ListAllMenu'
            ? {
                HasError: false,
                Result: [{ MenuID: 1, Title: 'All services', RoutePath: '', DisplayOrder: 1 }],
              }
            : url.pathname === '/User/ListAllsubMenu'
              ? {
                  HasError: false,
                  Result: menuPaths.map((path, index) => ({
                    MenuID: index + 2,
                    Title: path.split('/').at(-1),
                    RoutePath: path,
                  })),
                }
              : url.pathname === '/MasterData/GenderList'
                ? {
                    HasError: false,
                    Result: [
                      { GenderId: 1, GenderName: 'Female' },
                      { GenderId: 2, GenderName: 'Male' },
                    ],
                  }
                : { HasError: false, Result: [], TotalRecords: 0 };
    await route.fulfill({ json: result });
  });
}
async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Username', { exact: true }).fill('tester');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'My profile', exact: true })).toBeVisible();
}
test('login, authenticated navigation, table filtering, logout', async ({ page }) => {
  await mockApi(page);
  await login(page);
  await page.goto('/Dashboard/Gender');
  await expect(page.getByRole('cell', { name: 'Female', exact: true })).toBeVisible();
  await page.screenshot({ path: `test-results/dashboard-${test.info().project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('searchbox').fill('Female');
  await expect(page.getByRole('cell', { name: 'Male', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/Dashboard/Gender');
  await expect(page).toHaveURL(/\/login$/);
});
test('all dashboard routes render without issuing writes on navigation', async ({ page }) => {
  test.setTimeout(240_000);
  await mockApi(page);
  await login(page);
  const mutations: string[] = [];
  page.on('request', (request) => {
    if (
      /NewPayinRequest|AddOriginator|CreateNew|ApproveReject|ChangePayin|FinoTransaction$/.test(
        request.url(),
      )
    )
      mutations.push(request.url());
  });
  for (const definition of pages.filter((p) => p.path.startsWith('/Dashboard/'))) {
    await page.goto(definition.path);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.getByText('This page could not be loaded')).toHaveCount(0);
    await expect(page.getByText('Access denied', { exact: true })).toHaveCount(0);
  }
  expect(mutations).toEqual([]);
});
test('a direct URL cannot bypass server menu permissions', async ({ page }) => {
  await mockApi(page, ['/Dashboard/Gender']);
  await login(page);
  await page.goto('/Dashboard/Orglistcmp');
  await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible();
});
test('unknown URLs show a not-found page', async ({ page }) => {
  await page.goto('/missing-page');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

