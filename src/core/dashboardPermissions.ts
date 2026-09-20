import type { MenuItem } from './navigation';

export const dashboardCards = {
  'dashboard-total-commission': 'Total commission earned',
  'dashboard-total-transactions': 'Total transactions',
  'dashboard-transaction-amount': 'Transaction amount',
  'dashboard-transaction-trend': 'Transaction trend',
  'dashboard-top-transactions': 'Top 10 transactions',
  'dashboard-daybook': 'Daybook',
} as const;
export type DashboardCardId = keyof typeof dashboardCards;
export type DashboardCardPermissions = Partial<Record<DashboardCardId, boolean>>;
export const dashboardCardConfig: {
  mode: 'configured' | 'rolePermissions';
  cards: Record<DashboardCardId, boolean>;
} = {
  mode: 'configured',
  cards: {
    'dashboard-total-commission': true,
    'dashboard-total-transactions': true,
    'dashboard-transaction-amount': true,
    'dashboard-transaction-trend': true,
    'dashboard-top-transactions': true,
    'dashboard-daybook': true,
  },
};

export function configuredDashboardPermissions(menu: MenuItem[]): DashboardCardPermissions {
  return dashboardCardConfig.mode === 'configured'
    ? dashboardCardConfig.cards
    : dashboardPermissions(menu);
}
export const dashboardCardPermissionPath = (id: DashboardCardId) =>
  `/Dashboard/UserDashboard#${id}`;

// The server's user-scoped menu response already resolves role and menu permissions.
export function dashboardPermissions(menu: MenuItem[]): DashboardCardPermissions {
  const paths = new Set<string>();
  function visit(items: MenuItem[]) {
    for (const item of items) {
      if (
        item.Status !== undefined &&
        item.Status !== 1 &&
        item.Status !== '1' &&
        item.Status !== true
      )
        continue;
      if (item.RoutePath) paths.add('/' + item.RoutePath.trim().replace(/^\/+/, '').toLowerCase());
      if (item.children) visit(item.children);
    }
  }
  visit(menu);
  return Object.fromEntries(
    (Object.keys(dashboardCards) as DashboardCardId[]).map((id) => [
      id,
      paths.has(dashboardCardPermissionPath(id).toLowerCase()),
    ]),
  );
}
