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

export const UserMgrService = {
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
};
