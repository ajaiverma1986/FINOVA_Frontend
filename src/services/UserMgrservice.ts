import { request } from '../core/api';

export interface CreateUserMasterRequest {
  UserTypeId: number | null;
  OrganizationID: number;
  UserName: string | null;
  Password: string | null;
  Title: string | null;
  FirstName: string | null;
  MiddleName: string | null;
  LastName: string | null;
  GenderID: number;
  IsPasswordExpired: boolean;
  UserId: number;
  IsLocked: boolean;
  LockedTill: string | null;
  Status: number;
  EmailId: string | null;
  MobileNo: string | null;
  RemarkReason: string | null;
}

export interface UpdateUserMasterRequest {
  UserMasterID: number;
  UserTypeId: number | null;
  OrganizationID: number;
  UserName: string | null;
  Title: string | null;
  FirstName: string | null;
  MiddleName: string | null;
  LastName: string | null;
  GenderID: number;
  Status: number;
  EmailId: string | null;
  MobileNo: string | null;
  RemarkReason: string | null;
}

export interface ChangeUserPasswordRequest {
  UserMasterID: number;
  Password: string | null;
  IsPasswordExpired: boolean;
}

export interface LockUserMasterRequest {
  UserMasterID: number;
  LockedTill: string | null;
  RemarkReason: string | null;
}

export interface CreateUserAddressRequest {
  UserMasterId: number;
  AddressTypeId: number;
  Pincode: string | null;
  PincodeDataId: number;
  Address1: string | null;
  Address2: string | null;
  Address3: string | null;
  Status: number;
}

export interface UpdateUserAddressRequest {
  UserAddressID: number;
  UserMasterId: number;
  AddressTypeId: number;
  Pincode: string | null;
  PincodeDataId: number;
  Address1: string | null;
  Address2: string | null;
  Address3: string | null;
  Status: number;
}

export interface CreateUserKycRequest {
  UserMasterId: number;
  KycID: number;
  DocumentNo: string | null;
  File?: File | null;
  FileUrl: string | null;
  MediaExtension: string | null;
  MediaContentType: string | null;
  RejectedReason: string | null;
  Status: number;
}

export interface UpdateUserKycRequest {
  UserKYCID: number;
  UserMasterId: number;
  KycID: number;
  DocumentNo: string | null;
  File?: File | null;
  FileUrl: string | null;
  MediaExtension: string | null;
  MediaContentType: string | null;
  RejectedReason: string | null;
  Status: number;
}

export interface CreateUserBankAccountRequest {
  UserMasterID: number;
  BankId: number;
  AccountName: string | null;
  AccountNo: string | null;
  Ifsccode: string | null;
  File?: File | null;
  Status: number;
}

export interface UpdateUserBankAccountRequest {
  OriginatorAccountID: number;
  UserMasterID: number;
  BankId: number;
  AccountName: string | null;
  AccountNo: string | null;
  Ifsccode: string | null;
  File?: File | null;
  Status: number;
}

export interface CreateUserConfigurationRequest {
  UserMasterId: number;
  MinTxn: number;
  MaxTxn: number;
  ChargeTypeOn: number;
  PlanId: number;
  MaxPayinamount: number;
  MaxNoofcountPayin: number;
  SameAmountPayinAllowed: number;
}

export interface UpdateUserConfigurationRequest {
  ConfigurationId: number;
  UserMasterId: number;
  MinTxn: number;
  MaxTxn: number;
  ChargeTypeOn: number;
  PlanId: number;
  MaxPayinamount: number;
  MaxNoofcountPayin: number;
  SameAmountPayinAllowed: number;
}

function userBankAccountFormData(
  body: CreateUserBankAccountRequest | UpdateUserBankAccountRequest,
) {
  const form = new FormData();
  if ('OriginatorAccountID' in body)
    form.append('OriginatorAccountID', String(body.OriginatorAccountID));
  form.append('UserMasterID', String(body.UserMasterID));
  form.append('BankId', String(body.BankId));
  if (body.AccountName != null) form.append('AccountName', body.AccountName);
  if (body.AccountNo != null) form.append('AccountNo', body.AccountNo);
  if (body.Ifsccode != null) form.append('Ifsccode', body.Ifsccode);
  if (body.File) form.append('File', body.File);
  form.append('Status', String(body.Status));
  return form;
}

function userKycFormData(body: CreateUserKycRequest | UpdateUserKycRequest) {
  const form = new FormData();
  if ('UserKYCID' in body) form.append('UserKycMasterId', String(body.UserKYCID));
  form.append('UserMasterId', String(body.UserMasterId));
  form.append('KycID', String(body.KycID));
  if (body.DocumentNo != null) form.append('DocumentNo', body.DocumentNo);
  if (body.File) form.append('File', body.File);
  if (body.RejectedReason != null) form.append('RejectedReason', body.RejectedReason);
  form.append('Status', String(body.Status));
  return form;
}

export interface CreateOtherDetailsRequest {
  UserMasterId: number | null;
  Pancard: string | null;
  AadharCard: string | null;
  GSTNo: string | null;
  Status: number;
}

export interface UpdateOtherDetailsRequest {
  OtherDetailId: number;
  UserMasterId: number | null;
  Pancard: string | null;
  AadharCard: string | null;
  GSTNo: string | null;
  Status: number;
}

export const UserMgrService = {
  uploadUserKycFile: (userMasterID: number, file: File, signal?: AbortSignal) => {
    const body = new FormData();
    body.append('UserMasterID', String(userMasterID));
    body.append('File', file);
    return request<{ FileUrl: string; MediaExtension: string; MediaContentType: string }>(
      '/UserMgr/UploadUserKycFile',
      { method: 'POST', body, signal },
    );
  },
  createUserMaster: (body: CreateUserMasterRequest, signal?: AbortSignal) =>
    request('/UserMgr/CreateUserMaster', { method: 'POST', body, signal }),
  updateUserMaster: (body: UpdateUserMasterRequest, signal?: AbortSignal) =>
    request('/UserMgr/UpdateUserMaster', { method: 'POST', body, signal }),
  deleteUserMaster: (userMasterID: number, signal?: AbortSignal) =>
    request('/UserMgr/DeleteUserMaster/' + encodeURIComponent(String(userMasterID)), {
      method: 'DELETE',
      signal,
    }),
  getUserMasterById: (userMasterID: number, signal?: AbortSignal) =>
    request('/UserMgr/GetUserMasterByID?userMasterID=' + encodeURIComponent(String(userMasterID)), {
      method: 'GET',
      signal,
    }),
  getAllUserMasters: (signal?: AbortSignal) =>
    request('/UserMgr/GetAllUserMasters', { method: 'GET', signal }),
  getActiveUserMasters: (signal?: AbortSignal) =>
    request('/UserMgr/GetActiveUserMasters', { method: 'GET', signal }),
  getUserMastersByOrganizationId: (organizationID: number, signal?: AbortSignal) =>
    request(
      '/UserMgr/GetUserMastersByOrganizationID?organizationID=' +
        encodeURIComponent(String(organizationID)),
      { method: 'GET', signal },
    ),
  getUserMastersByUserTypeId: (userTypeID: number, signal?: AbortSignal) =>
    request(
      '/UserMgr/GetUserMastersByUserTypeID?userTypeID=' + encodeURIComponent(String(userTypeID)),
      { method: 'GET', signal },
    ),
  getUserMasterByUserName: (userName: string, signal?: AbortSignal) =>
    request('/UserMgr/GetUserMasterByUserName?userName=' + encodeURIComponent(String(userName)), {
      method: 'GET',
      signal,
    }),
  changeUserPassword: (body: ChangeUserPasswordRequest, signal?: AbortSignal) =>
    request('/UserMgr/ChangeUserPassword', { method: 'POST', body, signal }),
  lockUserMaster: (body: LockUserMasterRequest, signal?: AbortSignal) =>
    request('/UserMgr/LockUserMaster', { method: 'POST', body, signal }),
  unlockUserMaster: (userMasterID: number, signal?: AbortSignal) =>
    request('/UserMgr/UnlockUserMaster/' + encodeURIComponent(String(userMasterID)), {
      method: 'POST',
      signal,
    }),
  createUserAddress: (body: CreateUserAddressRequest, signal?: AbortSignal) =>
    request('/UserMgr/CreateUserAddress', { method: 'POST', body, signal }),
  updateUserAddress: (body: UpdateUserAddressRequest, signal?: AbortSignal) =>
    request('/UserMgr/UpdateUserAddress', { method: 'POST', body, signal }),
  deleteUserAddress: (userAddressID: number, signal?: AbortSignal) =>
    request('/UserMgr/DeleteUserAddress/' + encodeURIComponent(String(userAddressID)), {
      method: 'DELETE',
      signal,
    }),
  getUserAddressById: (userAddressID: number, signal?: AbortSignal) =>
    request(
      '/UserMgr/GetUserAddressByID?userAddressID=' + encodeURIComponent(String(userAddressID)),
      { method: 'GET', signal },
    ),
  getAllUserAddresses: (signal?: AbortSignal) =>
    request('/UserMgr/GetAllUserAddresses', { method: 'GET', signal }),
  getActiveUserAddresses: (signal?: AbortSignal) =>
    request('/UserMgr/GetActiveUserAddresses', { method: 'GET', signal }),
  getUserAddressesByUserMasterId: (userMasterId: number, signal?: AbortSignal) =>
    request(
      '/UserMgr/GetUserAddressesByUserMasterID?userMasterId=' +
        encodeURIComponent(String(userMasterId)),
      { method: 'GET', signal },
    ),
  getActiveUserAddressesByUserMasterId: (userMasterId: number, signal?: AbortSignal) =>
    request(
      '/UserMgr/GetActiveUserAddressesByUserMasterID?userMasterId=' +
        encodeURIComponent(String(userMasterId)),
      { method: 'GET', signal },
    ),
  createUserKyc: (body: CreateUserKycRequest, signal?: AbortSignal) =>
    request('/UserMgr/CreateUserKyc', { method: 'POST', body: userKycFormData(body), signal }),
  updateUserKyc: (body: UpdateUserKycRequest, signal?: AbortSignal) =>
    request('/UserMgr/UpdateUserKyc', { method: 'POST', body: userKycFormData(body), signal }),
  deleteUserKyc: (userKYCID: number, signal?: AbortSignal) =>
    request('/UserMgr/DeleteUserKyc/' + encodeURIComponent(String(userKYCID)), {
      method: 'DELETE',
      signal,
    }),
  getUserKycById: (userKYCID: number, signal?: AbortSignal) =>
    request('/UserMgr/GetUserKycByID?userKYCID=' + encodeURIComponent(String(userKYCID)), {
      method: 'GET',
      signal,
    }),
  getAllUserKyc: (signal?: AbortSignal) =>
    request('/UserMgr/GetAllUserKyc', { method: 'GET', signal }),
  getActiveUserKyc: (signal?: AbortSignal) =>
    request('/UserMgr/GetActiveUserKyc', { method: 'GET', signal }),
  getUserKycByUserMasterId: (userMasterId: number, signal?: AbortSignal) =>
    request(
      '/UserMgr/GetUserKycByUserMasterID?userMasterId=' + encodeURIComponent(String(userMasterId)),
      { method: 'GET', signal },
    ),
  getActiveUserKycByUserMasterId: (userMasterId: number, signal?: AbortSignal) =>
    request(
      '/UserMgr/GetActiveUserKycByUserMasterID?userMasterId=' +
        encodeURIComponent(String(userMasterId)),
      { method: 'GET', signal },
    ),
  createUserBankAccount: (body: CreateUserBankAccountRequest, signal?: AbortSignal) =>
    request('/UserMgr/CreateUserBankAccount', {
      method: 'POST',
      body: userBankAccountFormData(body),
      signal,
    }),
  updateUserBankAccount: (body: UpdateUserBankAccountRequest, signal?: AbortSignal) =>
    request('/UserMgr/UpdateUserBankAccount', {
      method: 'POST',
      body: userBankAccountFormData(body),
      signal,
    }),
  deleteUserBankAccount: (originatorAccountID: number, signal?: AbortSignal) =>
    request('/UserMgr/DeleteUserBankAccount/' + encodeURIComponent(String(originatorAccountID)), {
      method: 'DELETE',
      signal,
    }),
  getUserBankAccountById: (originatorAccountID: number, signal?: AbortSignal) =>
    request(
      '/UserMgr/GetUserBankAccountByID?originatorAccountID=' +
        encodeURIComponent(String(originatorAccountID)),
      { method: 'GET', signal },
    ),
  getAllUserBankAccounts: (signal?: AbortSignal) =>
    request('/UserMgr/GetAllUserBankAccounts', { method: 'GET', signal }),
  getActiveUserBankAccounts: (signal?: AbortSignal) =>
    request('/UserMgr/GetActiveUserBankAccounts', { method: 'GET', signal }),
  getUserBankAccountsByUserMasterId: (userMasterID: number, signal?: AbortSignal) =>
    request(
      '/UserMgr/GetUserBankAccountsByUserMasterID?userMasterID=' +
        encodeURIComponent(String(userMasterID)),
      { method: 'GET', signal },
    ),
  getActiveUserBankAccountsByUserMasterId: (userMasterID: number, signal?: AbortSignal) =>
    request(
      '/UserMgr/GetActiveUserBankAccountsByUserMasterID?userMasterID=' +
        encodeURIComponent(String(userMasterID)),
      { method: 'GET', signal },
    ),
  createUserConfiguration: (body: CreateUserConfigurationRequest, signal?: AbortSignal) =>
    request('/UserMgr/CreateUserConfiguration', { method: 'POST', body, signal }),
  updateUserConfiguration: (body: UpdateUserConfigurationRequest, signal?: AbortSignal) =>
    request('/UserMgr/UpdateUserConfiguration', { method: 'POST', body, signal }),
  deleteUserConfiguration: (configurationId: number, signal?: AbortSignal) =>
    request('/UserMgr/DeleteUserConfiguration/' + encodeURIComponent(String(configurationId)), {
      method: 'DELETE',
      signal,
    }),
  getUserConfigurationById: (configurationId: number, signal?: AbortSignal) =>
    request(
      '/UserMgr/GetUserConfigurationByID?configurationId=' +
        encodeURIComponent(String(configurationId)),
      { method: 'GET', signal },
    ),
  getAllUserConfigurations: (signal?: AbortSignal) =>
    request('/UserMgr/GetAllUserConfigurations', { method: 'GET', signal }),
  getUserConfigurationByUserMasterId: (userMasterId: number, signal?: AbortSignal) =>
    request(
      '/UserMgr/GetUserConfigurationByUserMasterID?userMasterId=' +
        encodeURIComponent(String(userMasterId)),
      { method: 'GET', signal },
    ),
  createOtherDetails: (body: CreateOtherDetailsRequest, signal?: AbortSignal) =>
    request('/UserMgr/CreateOtherDetails', { method: 'POST', body, signal }),
  updateOtherDetails: (body: UpdateOtherDetailsRequest, signal?: AbortSignal) =>
    request('/UserMgr/UpdateOtherDetails', { method: 'POST', body, signal }),
  deleteOtherDetails: (otherDetailId: number, signal?: AbortSignal) =>
    request('/UserMgr/DeleteOtherDetails/' + encodeURIComponent(String(otherDetailId)), {
      method: 'DELETE',
      signal,
    }),
  getOtherDetailsById: (otherDetailId: number, signal?: AbortSignal) =>
    request(
      '/UserMgr/GetOtherDetailsByID?otherDetailId=' + encodeURIComponent(String(otherDetailId)),
      { method: 'GET', signal },
    ),
  getAllOtherDetails: (signal?: AbortSignal) =>
    request('/UserMgr/GetAllOtherDetails', { method: 'GET', signal }),
  getActiveOtherDetails: (signal?: AbortSignal) =>
    request('/UserMgr/GetActiveOtherDetails', { method: 'GET', signal }),
  getOtherDetailsByUserMasterId: (userMasterId: number, signal?: AbortSignal) =>
    request(
      '/UserMgr/GetOtherDetailsByUserMasterID?userMasterId=' +
        encodeURIComponent(String(userMasterId)),
      { method: 'GET', signal },
    ),
  getActiveOtherDetailsByUserMasterId: (userMasterId: number, signal?: AbortSignal) =>
    request(
      '/UserMgr/GetActiveOtherDetailsByUserMasterID?userMasterId=' +
        encodeURIComponent(String(userMasterId)),
      { method: 'GET', signal },
    ),
};
