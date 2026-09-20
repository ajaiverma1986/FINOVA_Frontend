import { expect, it } from 'vitest';
import { dashboardPermissions } from './dashboardPermissions';

it('grants cards from user-scoped menu entries and ignores inactive or unrelated entries', () => {
  const grants = dashboardPermissions([
    { MenuID: 1, Title: 'Dashboard', RoutePath: '/Dashboard/UserDashboard', children: [
      { MenuID: 2, Title: 'Commission', RoutePath: '/Dashboard/UserDashboard#dashboard-total-commission', Status: 1 },
      { MenuID: 3, Title: 'Daybook', RoutePath: '/Dashboard/UserDashboard#dashboard-daybook', Status: 0 },
    ] },
  ]);
  expect(grants['dashboard-total-commission']).toBe(true);
  expect(grants['dashboard-daybook']).toBe(false);
  expect(grants['dashboard-total-transactions']).toBe(false);
  expect(Object.values(dashboardPermissions([])).every(granted => !granted)).toBe(true);
});
