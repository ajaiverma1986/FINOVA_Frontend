import { z } from 'zod';
import { request } from './api';

const menuSchema = z
  .object({
    MenuID: z.number(),
    Title: z.string(),
    RoutePath: z.string().nullish(),
    DisplayOrder: z.number().optional(),
  })
  .passthrough();
export type MenuItem = z.infer<typeof menuSchema> & { children?: MenuItem[] };
export function withNotificationPages(parent: MenuItem): MenuItem {
  // A server-returned Notification Manager group exposes its built-in pages.
  // Explicit database submenus take precedence over these defaults.
  if (
    parent.Title.trim().toLowerCase() !== 'notification manager' ||
    parent.RoutePath?.trim() !== '#' ||
    parent.children?.length
  )
    return parent;
  return {
    ...parent,
    children: [
      {
        MenuID: -1,
        Title: 'Email Gateways',
        RoutePath: '/Dashboard/Notifications/EmailGatwayList',
      },
      { MenuID: -2, Title: 'Create Email Gateway', RoutePath: '/Dashboard/Notifications/Create' },
      { MenuID: -3, Title: 'SMS Gateways', RoutePath: '/Dashboard/Notifications/SMSGatewayList' },
      { MenuID: -4, Title: 'Create SMS Gateway', RoutePath: '/Dashboard/Notifications/SMS/Create' },
      { MenuID: -5, Title: 'Notification Templates', RoutePath: '/Dashboard/Notifications/Templates' },
      { MenuID: -6, Title: 'Create Notification Template', RoutePath: '/Dashboard/Notifications/Templates/Create' },
      { MenuID: -7, Title: 'Template Types', RoutePath: '/Dashboard/Notifications/TemplateTypes' },
      { MenuID: -9, Title: 'Create Template Type', RoutePath: '/Dashboard/Notifications/TemplateTypes/Create' },
      { MenuID: -8, Title: 'Service Types', RoutePath: '/Dashboard/Notifications/ServiceTypes' },
      { MenuID: -10, Title: 'Create Service Type', RoutePath: '/Dashboard/Notifications/ServiceTypes/Create' },
    ],
  };
}
export function routePath(path: string) {
  const clean = path.trim().replace(/^\/+/, '');
  return '/' + clean.replace(/\/+$/, '');
}
export async function loadMenu(signal?: AbortSignal): Promise<MenuItem[]> {
  const result = await request('/User/ListAllMenu', { signal });
  const parents = z.array(menuSchema).parse(result.Result);
  return Promise.all(
    parents
      .sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0))
      .map(async (parent) => {
        const result = await request('/User/ListAllsubMenu?Menuid=' + parent.MenuID, { signal });
        const children = z
          .array(menuSchema)
          .parse(result.Result)
          .sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
        return withNotificationPages({ ...parent, children });
      }),
  );
}
export function permittedPaths(menu: MenuItem[]) {
  return new Set(
    menu
      .flatMap((item) => [item, ...(item.children || [])])
      .filter((item) => item.RoutePath)
      .map((item) => routePath(item.RoutePath!).toLowerCase()),
  );
}
