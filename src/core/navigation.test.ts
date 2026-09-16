import { describe, expect, it } from 'vitest';
import { permittedPaths, withNotificationPages } from './navigation';
describe('navigation permissions', () => {
  it('provides notification pages for the returned placeholder parent', () => {
    const parent = withNotificationPages({
      MenuID: 10,
      Title: 'Notification Manager',
      RoutePath: '#',
      children: [],
    });
    expect(parent.children?.map((child) => child.RoutePath)).toEqual([
      '/Dashboard/Notifications/EmailGatwayList',
      '/Dashboard/Notifications/Create',
      '/Dashboard/Notifications/SMSGatewayList',
      '/Dashboard/Notifications/SMS/Create',
      '/Dashboard/Notifications/Templates',
      '/Dashboard/Notifications/Templates/Create',
      '/Dashboard/Notifications/TemplateTypes',
      '/Dashboard/Notifications/TemplateTypes/Create',
      '/Dashboard/Notifications/ServiceTypes',
      '/Dashboard/Notifications/ServiceTypes/Create',
    ]);
    expect(permittedPaths([parent]).has('/dashboard/notifications/create')).toBe(true);
    expect(permittedPaths([]).has('/dashboard/notifications/emailgatwaylist')).toBe(false);
  });
  it('preserves explicit server submenus and leaves unrelated groups unchanged', () => {
    const parent = {
      MenuID: 10,
      Title: 'Notification Manager',
      RoutePath: '#',
      children: [
        { MenuID: 11, Title: 'Create only', RoutePath: '/Dashboard/Notifications/Create' },
      ],
    };
    expect(withNotificationPages(parent)).toBe(parent);
    expect(
      permittedPaths([withNotificationPages(parent)]).has(
        '/dashboard/notifications/emailgatwaylist',
      ),
    ).toBe(false);
    const other = { MenuID: 12, Title: 'Other', RoutePath: '#' };
    expect(withNotificationPages(other)).toBe(other);
  });
  it('only includes server-granted route paths and normalizes their casing', () => {
    const paths = permittedPaths([
      {
        MenuID: 1,
        Title: 'Masters',
        children: [{ MenuID: 2, Title: 'Gender', RoutePath: 'Dashboard/Gender/' }],
      },
    ]);
    expect(paths.has('/dashboard/gender')).toBe(true);
    expect(paths.has('/dashboard/orglistcmp')).toBe(false);
  });
});
