import { expect, test } from '@playwright/test';

test('pay-in requests show filters, paging, selection, and rejection in the browser', async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      'finova.auth',
      JSON.stringify({
        token: 'test-token',
        username: 'tester',
        displayName: 'Tester',
        userTypeId: 1,
        expiresAt: Date.now() + 3600000,
      }),
    ),
  );
  await page.route('**/User/ListAllMenu', (route) =>
    route.fulfill({ json: { Result: [{ MenuID: 1, Title: 'Wallet', RoutePath: '#' }] } }),
  );
  await page.route('**/User/ListAllsubMenu?*', (route) =>
    route.fulfill({
      json: {
        Result: [{ MenuID: 2, Title: 'Pay-in requests', RoutePath: '/Dashboard/PayinRequestList' }],
      },
    }),
  );
  await page.route('**/MasterData/GetActivePaymentChanels', (route) =>
    route.fulfill({
      json: { Result: [{ PaymentChanelID: 4, PaymentChanelName: 'Bank transfer' }] },
    }),
  );
  await page.route('**/MasterData/GetActivePaymentModes', (route) =>
    route.fulfill({
      json: { Result: [{ PaymentModeID: 6, PaymentChanelID: 4, PaymentModeName: 'NEFT' }] },
    }),
  );
  const decisions: unknown[] = [];
  await page.route('**/Wallet/ApproveRejectPayinRequest', async (route) => {
    decisions.push(route.request().postDataJSON());
    await route.fulfill({ json: { HasError: false, Result: 1 } });
  });
  await page.route('**/Wallet/SearchPayinRequests', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.PageSize).toBe(20);
    expect(body.Status).toBe(1);
    const records = Array.from({ length: body.PageNumber === 1 ? 20 : 1 }, (_, index) => ({
      RequestID: (body.PageNumber - 1) * 20 + index + 1,
      UserName: `Partner ${index + 1}`,
      Status: 1,
      StatusName: 'Pending',
      PaymentChanelName: 'Bank transfer',
      PaymentModeName: 'NEFT',
      Amount: 2500,
      Charge: 0,
      CreatedOn: '2026-09-19T12:00:00',
      RefNo1: 'REF123',
      RecieptFileurl: '/uploads/receipt.jpg',
    }));
    await route.fulfill({
      json: { Result: { Records: records, Paging: { TotalRecords: 21, TotalPages: 2 } } },
    });
  });
  await page.goto('/Dashboard/PayinRequestList');
  await expect(page.getByRole('heading', { name: 'Pay-in requests' })).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(21);
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Select all pending requests on this page' }).check();
  await expect(page.getByText('20 selected on this page')).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await page.getByRole('checkbox', { name: 'Select request 21', exact: true }).check();
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  await page.getByLabel('Rejected reason').fill('Incorrect receipt');
  await page.getByRole('button', { name: 'Confirm rejection' }).click();
  await expect(page.getByText('1 request rejected.')).toBeVisible();
  expect(decisions).toEqual([
    { RequestID: 21, Action: 'REJECT', RejectedReason: 'Incorrect receipt' },
  ]);
  await expect(page.getByRole('dialog', { name: 'Reject selected requests' })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: test.info().outputPath('payin-requests.png'), fullPage: true });
});
