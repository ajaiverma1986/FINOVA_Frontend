# Dashboard card permissions

## Current configuration

Edit `dashboardCardConfig` in `src/core/dashboardPermissions.ts`. It currently uses `mode: 'configured'` with all six cards set to `true`, so every card is visible. Set any card to `false` to hide it. Set `mode: 'rolePermissions'` to restore the backend role/menu permission behavior described below. Configuration mode does not wait for card menu grants.

Each card has the same stable HTML `id`, `data-card-id`, and permission key.

| Card ID | Card |
| --- | --- |
| `dashboard-total-commission` | Total commission earned |
| `dashboard-total-transactions` | Total transactions |
| `dashboard-transaction-amount` | Transaction amount |
| `dashboard-transaction-trend` | Transaction trend |
| `dashboard-top-transactions` | Top 10 transactions |
| `dashboard-daybook` | Daybook |

The existing signed-in user's `/User/ListAllMenu` and `/User/ListAllsubMenu` responses resolve role/menu permissions. Configure a menu permission entry for each card with `RoutePath` equal to `/Dashboard/UserDashboard#<card-id>` and assign it through the existing role/menu permission setup. Only return entries granted to that user. No new database entries or role assignments are created by this frontend change.

For example, `/Dashboard/UserDashboard#dashboard-daybook` enables Daybook. Removing the grant or marking the entry inactive hides the card. Ordinary dashboard route access does not enable all cards. The frontend fails closed while permissions load or fail; users with no card grants see an empty-access message and no dashboard report request is made. Permissions refresh every 60 seconds while the page is open, and on window focus.

`UserDashboard` also accepts a dynamic `cardPermissions` map for integration with a future dedicated permission endpoint:

```tsx
<UserDashboard userId={userId} cardPermissions={{
  'dashboard-total-transactions': true,
  'dashboard-daybook': false,
}} />
```

Only explicit `true` enables a card. Changes to this prop immediately change the rendered cards. The backend must independently enforce report-data access; hiding a card does not remove its data from the combined AdminDashboard response.
