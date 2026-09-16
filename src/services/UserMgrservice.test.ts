import { afterEach, expect, it, vi } from 'vitest';
import { request } from '../core/api';
import { UserMgrService } from './UserMgrservice';

vi.mock('../core/api', () => ({ request: vi.fn().mockResolvedValue({ Result: [] }) }));
afterEach(() => vi.clearAllMocks());

it.each([
  ['getAllUserMasters', [], '/UserMgr/GetAllUserMasters', 'GET'],
  ['getActiveUserMasters', [], '/UserMgr/GetActiveUserMasters', 'GET'],
  ['getUserMasterById', [7], '/UserMgr/GetUserMasterByID?userMasterID=7', 'GET'],
  [
    'getUserMastersByOrganizationId',
    [4],
    '/UserMgr/GetUserMastersByOrganizationID?organizationID=4',
    'GET',
  ],
  ['getUserMastersByUserTypeId', [3], '/UserMgr/GetUserMastersByUserTypeID?userTypeID=3', 'GET'],
  [
    'getUserMasterByUserName',
    ['a+b &c'],
    '/UserMgr/GetUserMasterByUserName?userName=a%2Bb%20%26c',
    'GET',
  ],
  ['deleteUserMaster', [7], '/UserMgr/DeleteUserMaster/7', 'DELETE'],
  ['unlockUserMaster', [7], '/UserMgr/UnlockUserMaster/7', 'POST'],
] as const)('%s uses the documented URL and method', async (name, args, path, method) => {
  const signal = new AbortController().signal;
  const call = UserMgrService[name] as (...args: unknown[]) => unknown;
  await call(...args, signal);
  expect(request).toHaveBeenCalledWith(path, { method, signal });
});

it.each([
  ['createUserMaster', 'CreateUserMaster'],
  ['updateUserMaster', 'UpdateUserMaster'],
  ['changeUserPassword', 'ChangeUserPassword'],
  ['lockUserMaster', 'LockUserMaster'],
] as const)('%s posts its request body', async (name, endpoint) => {
  const body = { UserMasterID: 7 };
  const signal = new AbortController().signal;
  const call = UserMgrService[name] as (...args: unknown[]) => unknown;
  await call(body, signal);
  expect(request).toHaveBeenCalledWith(`/UserMgr/${endpoint}`, { method: 'POST', body, signal });
});
