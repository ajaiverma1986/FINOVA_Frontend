import { request } from '../core/api';

export interface CreateApplicationRequest {
  OrganizationID: number;
  ApplicationName: string;
  ApplicationDescription: string;
}

export interface UpdateApplicationRequest {
  ApplicationID: number;
  OrganizationID: number;
  ApplicationTypeID: number;
  PlatformID: number;
  IconID: number;
  ApplicationToken: string;
  ApplicationName: string;
  ApplicationDescription: string;
  TokenCreatedDate: string;
  TokenExpireDate: string | null;
  UserTokenExpiresAfterMins: number;
  Status: number;
}

export interface CreateModuleRequest {
  ModuleID: number;
  ApplicationID: number;
  IconID: number;
  ModuleName: string;
  ModuleDescription: string;
  DefaultMenuUrl: string;
  Status: number;
}
export type UpdateModuleRequest = CreateModuleRequest;

export interface CreateMenuRequest {
  ModuleID: number;
  ParentID: number;
  IconID: number;
  Title: string;
  Tooltip: string;
  Description: string;
  RoutePath: string;
  DisplayOrder: number;
  Target: string;
  IsExternal: boolean;
  Status: number;
}
export interface UpdateMenuRequest extends CreateMenuRequest {
  MenuID: number;
}

export interface CreatePermissionRequest {
  PermissionName: string;
  PermissionDescription: string;
  Status: number;
}
export interface UpdatePermissionRequest extends CreatePermissionRequest {
  PermissionID: number;
}

export interface CreateMenuPermissionRequest {
  MenuID: number;
  PermissionID: number;
  Status: number;
}
export interface UpdateMenuPermissionRequest extends CreateMenuPermissionRequest {
  MenuPermissionID: number;
}

export interface CreateRoleRequest {
  IconID: number;
  RoleName: string;
  RoleDescription: string;
  Status: number;
}
export interface UpdateRoleRequest extends CreateRoleRequest {
  RoleID: number;
}

export interface CreateTaskRequest {
  TaskName: string;
  TaskTooltip: string;
  TaskDescription: string;
  EntityTypeID: number;
  TaskURI: string;
  Status: number;
}
export interface UpdateTaskRequest extends CreateTaskRequest {
  TaskID: number;
}

export interface CreateRoleTaskRequest {
  TaskID: number;
  RoleID: number;
  TAT: string;
  Status: number;
}
export interface UpdateRoleTaskRequest extends CreateRoleTaskRequest {
  RoleTaskID: number;
}

export interface CreateRolePermissionRequest {
  RoleID: number;
  PermissionID: number;
  Status: number;
}
export interface UpdateRolePermissionRequest extends CreateRolePermissionRequest {
  RolePermissionID: number;
}

function queryRequest(path: string, parameter: string, value: number, signal?: AbortSignal) {
  return request(`${path}?${parameter}=${encodeURIComponent(value)}`, { signal });
}

function deleteRequest(path: string, id: number, signal?: AbortSignal) {
  return request(`${path}/${encodeURIComponent(id)}`, { method: 'DELETE', signal });
}

export const AppMgrService = {
  createApplication: (values: CreateApplicationRequest, signal?: AbortSignal) =>
    request('/AppManager/CreateApplication', { method: 'POST', body: values, signal }),
  updateApplication: (values: UpdateApplicationRequest, signal?: AbortSignal) =>
    request('/AppManager/UpdateApplication', { method: 'POST', body: values, signal }),
  deleteApplication: (applicationID: number, signal?: AbortSignal) =>
    request(`/AppManager/DeleteApplication/${encodeURIComponent(applicationID)}`, {
      method: 'DELETE',
      signal,
    }),
  getApplicationById: (applicationID: number, signal?: AbortSignal) =>
    request(`/AppManager/GetApplicationByID?applicationID=${encodeURIComponent(applicationID)}`, {
      signal,
    }),
  getAllApplications: (signal?: AbortSignal) =>
    request('/AppManager/GetAllApplications', { signal }),
  getActiveApplications: (signal?: AbortSignal) =>
    request('/AppManager/GetActiveApplications', { signal }),
  getApplicationsByOrganizationId: (organizationID: number, signal?: AbortSignal) =>
    request(
      `/AppManager/GetApplicationsByOrganizationID?organizationID=${encodeURIComponent(organizationID)}`,
      { signal },
    ),
  getActiveApplicationsByOrganizationId: (organizationID: number, signal?: AbortSignal) =>
    request(
      `/AppManager/GetActiveApplicationsByOrganizationID?organizationID=${encodeURIComponent(organizationID)}`,
      { signal },
    ),
  createModule: (values: CreateModuleRequest, signal?: AbortSignal) =>
    request('/AppManager/CreateModule', { method: 'POST', body: values, signal }),
  updateModule: (values: UpdateModuleRequest, signal?: AbortSignal) =>
    request('/AppManager/UpdateModule', { method: 'POST', body: values, signal }),
  deleteModule: (moduleID: number, signal?: AbortSignal) =>
    deleteRequest('/AppManager/DeleteModule', moduleID, signal),
  getModuleById: (moduleID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetModuleByID', 'moduleID', moduleID, signal),
  getAllModules: (signal?: AbortSignal) => request('/AppManager/GetAllModules', { signal }),
  getActiveModules: (signal?: AbortSignal) =>
    request('/AppManager/GetActiveModules', { signal }),
  getModulesByApplicationId: (applicationID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetModulesByApplicationID', 'applicationID', applicationID, signal),
  getActiveModulesByApplicationId: (applicationID: number, signal?: AbortSignal) =>
    queryRequest(
      '/AppManager/GetActiveModulesByApplicationID',
      'applicationID',
      applicationID,
      signal,
    ),
  createMenu: (values: CreateMenuRequest, signal?: AbortSignal) =>
    request('/AppManager/CreateMenu', { method: 'POST', body: values, signal }),
  updateMenu: (values: UpdateMenuRequest, signal?: AbortSignal) =>
    request('/AppManager/UpdateMenu', { method: 'POST', body: values, signal }),
  deleteMenu: (menuID: number, signal?: AbortSignal) =>
    deleteRequest('/AppManager/DeleteMenu', menuID, signal),
  getMenuById: (menuID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetMenuByID', 'menuID', menuID, signal),
  getAllMenus: (signal?: AbortSignal) => request('/AppManager/GetAllMenus', { signal }),
  getActiveMenus: (signal?: AbortSignal) => request('/AppManager/GetActiveMenus', { signal }),
  getMenusByModuleId: (moduleID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetMenusByModuleID', 'moduleID', moduleID, signal),
  getActiveMenusByModuleId: (moduleID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetActiveMenusByModuleID', 'moduleID', moduleID, signal),
  getMenusByParentId: (parentID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetMenusByParentID', 'parentID', parentID, signal),
  createPermission: (values: CreatePermissionRequest, signal?: AbortSignal) =>
    request('/AppManager/CreatePermission', { method: 'POST', body: values, signal }),
  updatePermission: (values: UpdatePermissionRequest, signal?: AbortSignal) =>
    request('/AppManager/UpdatePermission', { method: 'POST', body: values, signal }),
  deletePermission: (permissionID: number, signal?: AbortSignal) =>
    deleteRequest('/AppManager/DeletePermission', permissionID, signal),
  getPermissionById: (permissionID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetPermissionByID', 'permissionID', permissionID, signal),
  getAllPermissions: (signal?: AbortSignal) =>
    request('/AppManager/GetAllPermissions', { signal }),
  getActivePermissions: (signal?: AbortSignal) =>
    request('/AppManager/GetActivePermissions', { signal }),
  createMenuPermission: (values: CreateMenuPermissionRequest, signal?: AbortSignal) =>
    request('/AppManager/CreateMenuPermission', { method: 'POST', body: values, signal }),
  updateMenuPermission: (values: UpdateMenuPermissionRequest, signal?: AbortSignal) =>
    request('/AppManager/UpdateMenuPermission', { method: 'POST', body: values, signal }),
  deleteMenuPermission: (menuPermissionID: number, signal?: AbortSignal) =>
    deleteRequest('/AppManager/DeleteMenuPermission', menuPermissionID, signal),
  getMenuPermissionById: (menuPermissionID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetMenuPermissionByID', 'menuPermissionID', menuPermissionID, signal),
  getAllMenuPermissions: (signal?: AbortSignal) =>
    request('/AppManager/GetAllMenuPermissions', { signal }),
  getActiveMenuPermissions: (signal?: AbortSignal) =>
    request('/AppManager/GetActiveMenuPermissions', { signal }),
  getMenuPermissionsByMenuId: (menuID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetMenuPermissionsByMenuID', 'menuID', menuID, signal),
  getActiveMenuPermissionsByMenuId: (menuID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetActiveMenuPermissionsByMenuID', 'menuID', menuID, signal),
  getMenuPermissionsByPermissionId: (permissionID: number, signal?: AbortSignal) =>
    queryRequest(
      '/AppManager/GetMenuPermissionsByPermissionID',
      'permissionID',
      permissionID,
      signal,
    ),
  createRole: (values: CreateRoleRequest, signal?: AbortSignal) =>
    request('/AppManager/CreateRole', { method: 'POST', body: values, signal }),
  updateRole: (values: UpdateRoleRequest, signal?: AbortSignal) =>
    request('/AppManager/UpdateRole', { method: 'POST', body: values, signal }),
  deleteRole: (roleID: number, signal?: AbortSignal) =>
    deleteRequest('/AppManager/DeleteRole', roleID, signal),
  getRoleById: (roleID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetRoleByID', 'roleID', roleID, signal),
  getAllRoles: (signal?: AbortSignal) => request('/AppManager/GetAllRoles', { signal }),
  getActiveRoles: (signal?: AbortSignal) => request('/AppManager/GetActiveRoles', { signal }),
  createTask: (values: CreateTaskRequest, signal?: AbortSignal) =>
    request('/AppManager/CreateTask', { method: 'POST', body: values, signal }),
  updateTask: (values: UpdateTaskRequest, signal?: AbortSignal) =>
    request('/AppManager/UpdateTask', { method: 'POST', body: values, signal }),
  deleteTask: (taskID: number, signal?: AbortSignal) =>
    deleteRequest('/AppManager/DeleteTask', taskID, signal),
  getTaskById: (taskID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetTaskByID', 'taskID', taskID, signal),
  getTaskByUid: (taskUID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetTaskByUID', 'taskUID', taskUID, signal),
  getAllTasks: (signal?: AbortSignal) => request('/AppManager/GetAllTasks', { signal }),
  getActiveTasks: (signal?: AbortSignal) => request('/AppManager/GetActiveTasks', { signal }),
  getTasksByEntityTypeId: (entityTypeID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetTasksByEntityTypeID', 'entityTypeID', entityTypeID, signal),
  getActiveTasksByEntityTypeId: (entityTypeID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetActiveTasksByEntityTypeID', 'entityTypeID', entityTypeID, signal),
  createRoleTask: (values: CreateRoleTaskRequest, signal?: AbortSignal) =>
    request('/AppManager/CreateRoleTask', { method: 'POST', body: values, signal }),
  updateRoleTask: (values: UpdateRoleTaskRequest, signal?: AbortSignal) =>
    request('/AppManager/UpdateRoleTask', { method: 'POST', body: values, signal }),
  deleteRoleTask: (roleTaskID: number, signal?: AbortSignal) =>
    deleteRequest('/AppManager/DeleteRoleTask', roleTaskID, signal),
  getRoleTaskById: (roleTaskID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetRoleTaskByID', 'roleTaskID', roleTaskID, signal),
  getRoleTaskByUid: (roleTaskUID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetRoleTaskByUID', 'roleTaskUID', roleTaskUID, signal),
  getAllRoleTasks: (signal?: AbortSignal) => request('/AppManager/GetAllRoleTasks', { signal }),
  getActiveRoleTasks: (signal?: AbortSignal) =>
    request('/AppManager/GetActiveRoleTasks', { signal }),
  getRoleTasksByRoleId: (roleID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetRoleTasksByRoleID', 'roleID', roleID, signal),
  getActiveRoleTasksByRoleId: (roleID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetActiveRoleTasksByRoleID', 'roleID', roleID, signal),
  getRoleTasksByTaskId: (taskID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetRoleTasksByTaskID', 'taskID', taskID, signal),
  createRolePermission: (values: CreateRolePermissionRequest, signal?: AbortSignal) =>
    request('/AppManager/CreateRolePermission', { method: 'POST', body: values, signal }),
  updateRolePermission: (values: UpdateRolePermissionRequest, signal?: AbortSignal) =>
    request('/AppManager/UpdateRolePermission', { method: 'POST', body: values, signal }),
  deleteRolePermission: (rolePermissionID: number, signal?: AbortSignal) =>
    deleteRequest('/AppManager/DeleteRolePermission', rolePermissionID, signal),
  getRolePermissionById: (rolePermissionID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetRolePermissionByID', 'rolePermissionID', rolePermissionID, signal),
  getAllRolePermissions: (signal?: AbortSignal) =>
    request('/AppManager/GetAllRolePermissions', { signal }),
  getActiveRolePermissions: (signal?: AbortSignal) =>
    request('/AppManager/GetActiveRolePermissions', { signal }),
  getRolePermissionsByRoleId: (roleID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetRolePermissionsByRoleID', 'roleID', roleID, signal),
  getActiveRolePermissionsByRoleId: (roleID: number, signal?: AbortSignal) =>
    queryRequest('/AppManager/GetActiveRolePermissionsByRoleID', 'roleID', roleID, signal),
  getRolePermissionsByPermissionId: (permissionID: number, signal?: AbortSignal) =>
    queryRequest(
      '/AppManager/GetRolePermissionsByPermissionID',
      'permissionID',
      permissionID,
      signal,
    ),
};
