import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppMgrService } from '../../services/AppMgrService';
import { OrgMgrService } from '../../services/OrgMgrService';
import AppManager from './AppManagerComponent';
import ModuleMaster from './ModuleMasterComponent';
import MenuMaster from './MenuMasterComponent';
import TaskMaster from './TaskMasterComponent';
import RoleMaster from './RoleMasterComponent';
import PermissionMaster from './PermissionMasterComponent';
import MenuPermissionMaster from './MenuPermissionMasterComponent';
import RolePermissionMaster from './RolePermissionMasterComponent';
import RoleTaskMaster from './RoleTaskMasterComponent';
import OrganizationMaster from '../OrgManager/OrgMgrMasterComponent';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it.each([
  ['application', AppManager],
  ['module', ModuleMaster],
  ['menu', MenuMaster],
  ['task', TaskMaster],
  ['role', RoleMaster],
  ['permission', PermissionMaster],
  ['menu permission', MenuPermissionMaster],
  ['role permission', RolePermissionMaster],
  ['role task', RoleTaskMaster],
  ['organization', OrganizationMaster],
])('opens row details and dismisses the %s popup', async (entity, Component) => {
  const row = {
    ApplicationID: 1, ModuleID: 1, MenuID: 1, TaskID: 1, RoleID: 1,
    PermissionID: 1, MenuPermissionID: 1, RolePermissionID: 1,
    RoleTaskID: 1, OrganizationID: 1, Status: 1,
  };
  for (const method of ['getAllApplications', 'getAllModules', 'getAllMenus', 'getAllTasks', 'getAllRoles', 'getAllPermissions', 'getAllMenuPermissions', 'getAllRolePermissions', 'getAllRoleTasks'] as const) {
    vi.spyOn(AppMgrService, method).mockResolvedValue({ Result: [row] });
  }
  for (const method of ['getApplicationById', 'getModuleById', 'getMenuById', 'getTaskById', 'getRoleById', 'getPermissionById', 'getMenuPermissionById', 'getRolePermissionById', 'getRoleTaskById'] as const) {
    vi.spyOn(AppMgrService, method).mockResolvedValue({ Result: [{ ...row, Description: 'Selected record details' }] });
  }
  vi.spyOn(OrgMgrService, 'getAllOrganizations').mockResolvedValue({ Result: [row] });
  vi.spyOn(OrgMgrService, 'getOrganizationById').mockResolvedValue({ Result: [{ ...row, Description: 'Selected record details' }] });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><Component /></QueryClientProvider>);
  const trigger = await screen.findByRole('button', { name: `View ${entity}` });
  fireEvent.click(trigger);
  const title = `${entity[0].toUpperCase()}${entity.slice(1)} details`;
  const dialog = await screen.findByRole('dialog', { name: title });
  expect(await within(dialog).findByText('Selected record details')).toBeDefined();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  fireEvent.click(trigger);
  fireEvent.keyDown(await screen.findByRole('dialog'), { key: 'Escape', code: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  client.clear();
});

it.each([
  ['application', AppManager],
  ['module', ModuleMaster],
  ['menu', MenuMaster],
  ['task', TaskMaster],
  ['role', RoleMaster],
  ['permission', PermissionMaster],
  ['menu permission', MenuPermissionMaster],
  ['role permission', RolePermissionMaster],
  ['role task', RoleTaskMaster],
 ])('opens and closes the %s create dialog', async (entity, Component) => {
  vi.spyOn(OrgMgrService, 'getActiveOrganizations').mockResolvedValue({ Result: [] });
  for (const method of ['getAllApplications', 'getAllModules', 'getAllMenus', 'getAllTasks', 'getAllRoles', 'getAllPermissions', 'getAllMenuPermissions', 'getAllRolePermissions', 'getAllRoleTasks'] as const) {
    vi.spyOn(AppMgrService, method).mockResolvedValue({ Result: [] });
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><Component /></QueryClientProvider>);
  const trigger = await screen.findByRole('button', { name: `Create ${entity}` });
  fireEvent.click(trigger);
  const dialog = await screen.findByRole('dialog', { name: `Create ${entity}` });
  expect(within(dialog).getByRole('button', { name: `Create ${entity}` })).toBeDefined();
  expect(dialog.querySelector('form')).not.toBeNull();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  fireEvent.click(trigger);
  fireEvent.keyDown(await screen.findByRole('dialog'), { key: 'Escape', code: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  client.clear();
});
