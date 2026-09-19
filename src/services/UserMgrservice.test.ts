import { afterEach, expect, it, vi } from 'vitest';
import { request } from '../core/api';
import { UserMgrService } from './UserMgrservice';

vi.mock('../core/api', () => ({ request: vi.fn().mockResolvedValue({ Result: [] }) }));
afterEach(() => vi.clearAllMocks());

it.each([
  ['deleteUserAddress', [7], '/UserMgr/DeleteUserAddress/7', 'DELETE'],
  ['getUserAddressById', [7], '/UserMgr/GetUserAddressByID?userAddressID=7', 'GET'],
  ['getAllUserAddresses', [], '/UserMgr/GetAllUserAddresses', 'GET'],
  ['getActiveUserAddresses', [], '/UserMgr/GetActiveUserAddresses', 'GET'],
  [
    'getUserAddressesByUserMasterId',
    [7],
    '/UserMgr/GetUserAddressesByUserMasterID?userMasterId=7',
    'GET',
  ],
  [
    'getActiveUserAddressesByUserMasterId',
    [7],
    '/UserMgr/GetActiveUserAddressesByUserMasterID?userMasterId=7',
    'GET',
  ],
  ['deleteUserKyc', [7], '/UserMgr/DeleteUserKyc/7', 'DELETE'],
  ['getUserKycById', [7], '/UserMgr/GetUserKycByID?userKYCID=7', 'GET'],
  ['getAllUserKyc', [], '/UserMgr/GetAllUserKyc', 'GET'],
  ['getActiveUserKyc', [], '/UserMgr/GetActiveUserKyc', 'GET'],
  ['getUserKycByUserMasterId', [7], '/UserMgr/GetUserKycByUserMasterID?userMasterId=7', 'GET'],
  [
    'getActiveUserKycByUserMasterId',
    [7],
    '/UserMgr/GetActiveUserKycByUserMasterID?userMasterId=7',
    'GET',
  ],
  ['deleteUserBankAccount', [7], '/UserMgr/DeleteUserBankAccount/7', 'DELETE'],
  ['getUserBankAccountById', [7], '/UserMgr/GetUserBankAccountByID?originatorAccountID=7', 'GET'],
  ['getAllUserBankAccounts', [], '/UserMgr/GetAllUserBankAccounts', 'GET'],
  ['getActiveUserBankAccounts', [], '/UserMgr/GetActiveUserBankAccounts', 'GET'],
  [
    'getUserBankAccountsByUserMasterId',
    [7],
    '/UserMgr/GetUserBankAccountsByUserMasterID?userMasterID=7',
    'GET',
  ],
  [
    'getActiveUserBankAccountsByUserMasterId',
    [7],
    '/UserMgr/GetActiveUserBankAccountsByUserMasterID?userMasterID=7',
    'GET',
  ],
  ['deleteUserConfiguration', [7], '/UserMgr/DeleteUserConfiguration/7', 'DELETE'],
  ['getUserConfigurationById', [7], '/UserMgr/GetUserConfigurationByID?configurationId=7', 'GET'],
  ['getAllUserConfigurations', [], '/UserMgr/GetAllUserConfigurations', 'GET'],
  [
    'getUserConfigurationByUserMasterId',
    [7],
    '/UserMgr/GetUserConfigurationByUserMasterID?userMasterId=7',
    'GET',
  ],
  ['deleteOtherDetails', [7], '/UserMgr/DeleteOtherDetails/7', 'DELETE'],
  ['getOtherDetailsById', [7], '/UserMgr/GetOtherDetailsByID?otherDetailId=7', 'GET'],
  ['getAllOtherDetails', [], '/UserMgr/GetAllOtherDetails', 'GET'],
  ['getActiveOtherDetails', [], '/UserMgr/GetActiveOtherDetails', 'GET'],
  [
    'getOtherDetailsByUserMasterId',
    [7],
    '/UserMgr/GetOtherDetailsByUserMasterID?userMasterId=7',
    'GET',
  ],
  [
    'getActiveOtherDetailsByUserMasterId',
    [7],
    '/UserMgr/GetActiveOtherDetailsByUserMasterID?userMasterId=7',
    'GET',
  ],
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
  ['createUserAddress', 'CreateUserAddress'],
  ['updateUserAddress', 'UpdateUserAddress'],
  ['createUserKyc', 'CreateUserKyc'],
  ['updateUserKyc', 'UpdateUserKyc'],
  ['createUserBankAccount', 'CreateUserBankAccount'],
  ['updateUserBankAccount', 'UpdateUserBankAccount'],
  ['createUserConfiguration', 'CreateUserConfiguration'],
  ['updateUserConfiguration', 'UpdateUserConfiguration'],
  ['createOtherDetails', 'CreateOtherDetails'],
  ['updateOtherDetails', 'UpdateOtherDetails'],
  ['createUserMaster', 'CreateUserMaster'],
  ['updateUserMaster', 'UpdateUserMaster'],
  ['changeUserPassword', 'ChangeUserPassword'],
  ['lockUserMaster', 'LockUserMaster'],
] as const)('%s posts its request body', async (name, endpoint) => {
  const body = { UserMasterID: 7 };
  const signal = new AbortController().signal;
  const call = UserMgrService[name] as (...args: unknown[]) => unknown;
  await call(body, signal);
  if (
    name === 'createUserKyc' ||
    name === 'updateUserKyc' ||
    name === 'createUserBankAccount' ||
    name === 'updateUserBankAccount'
  ) {
    expect(request).toHaveBeenCalledWith(
      `/UserMgr/${endpoint}`,
      expect.objectContaining({ method: 'POST', body: expect.any(FormData), signal }),
    );
  } else {
    expect(request).toHaveBeenCalledWith(`/UserMgr/${endpoint}`, { method: 'POST', body, signal });
  }
});

it('sends bank account files and IDs using the Swagger multipart fields', async () => {
  const file = new File(['document'], 'bank.pdf', { type: 'application/pdf' });
  const body = {
    UserMasterID: 7,
    BankId: 2,
    AccountName: 'Alex',
    AccountNo: '001234',
    Ifsccode: 'ABCD0000001',
    File: file,
    Status: 8,
  };
  await UserMgrService.createUserBankAccount(body);
  const createBody = vi.mocked(request).mock.calls[0][1]?.body as FormData;
  expect(Object.fromEntries(createBody.entries())).toEqual({
    UserMasterID: '7',
    BankId: '2',
    AccountName: 'Alex',
    AccountNo: '001234',
    Ifsccode: 'ABCD0000001',
    File: file,
    Status: '8',
  });
  await UserMgrService.updateUserBankAccount({ ...body, OriginatorAccountID: 12 });
  const updateBody = vi.mocked(request).mock.calls[1][1]?.body as FormData;
  expect(updateBody.get('OriginatorAccountID')).toBe('12');
  expect(updateBody.get('File')).toBe(file);
  await UserMgrService.updateUserBankAccount({ ...body, OriginatorAccountID: 12, File: null });
  const withoutFile = vi.mocked(request).mock.calls[2][1]?.body as FormData;
  expect(withoutFile.has('File')).toBe(false);
});

it('serializes KYC create and update requests using the Swagger multipart fields', async () => {
  const file = new File(['document'], 'kyc.pdf', { type: 'application/pdf' });
  await UserMgrService.createUserKyc({
    UserMasterId: 7,
    KycID: 30,
    DocumentNo: 'ABC123',
    File: file,
    FileUrl: null,
    MediaExtension: null,
    MediaContentType: null,
    RejectedReason: null,
    Status: 8,
  });
  const createBody = vi.mocked(request).mock.calls[0][1]?.body as FormData;
  expect(createBody.get('UserMasterId')).toBe('7');
  expect(createBody.get('KycID')).toBe('30');
  expect(createBody.get('DocumentNo')).toBe('ABC123');
  expect(createBody.get('File')).toBe(file);

  vi.clearAllMocks();
  await UserMgrService.updateUserKyc({
    UserKYCID: 12,
    UserMasterId: 7,
    KycID: 30,
    DocumentNo: 'ABC123',
    File: file,
    FileUrl: null,
    MediaExtension: null,
    MediaContentType: null,
    RejectedReason: null,
    Status: 8,
  });
  const updateBody = vi.mocked(request).mock.calls[0][1]?.body as FormData;
  expect(updateBody.get('UserKycMasterId')).toBe('12');
  expect(updateBody.get('File')).toBe(file);
});
