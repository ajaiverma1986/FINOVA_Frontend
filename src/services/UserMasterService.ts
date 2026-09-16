import { operationRequest } from '../core/api';
import { operations } from './operations';
import type { Fields } from '../core/types';

export const UserMasterService = {
  UserOnboarding: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.UserOnboarding'], values, signal),
  UploadUserLogo: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.UploadUserLogo'], values, signal),
  AddUserAccounts: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.AddUserAccounts'], values, signal),
  ListUserAccounts: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ListUserAccounts'], values, signal),
  AddUserAddress: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.AddUserAddress'], values, signal),
  ListUserAddresses: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ListUserAddresses'], values, signal),
  AddUserDeatilKYC: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.AddUserDeatilKYC'], values, signal),
  ListUserKYC: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ListUserKYC'], values, signal),
  ListUserKYCByUserId: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ListUserKYCByUserId'], values, signal),
  ListApplication: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ListApplication'], values, signal),
  CreateNewApplication: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.CreateNewApplication'], values, signal),
  ListUsers: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ListUsers'], values, signal),
  CreateNewUserData: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.CreateNewUserData'], values, signal),
  ListUserKYCByID: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ListUserKYCByID'], values, signal),
  DocumentView_Search: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.DocumentView_Search'], values, signal),
  ListAllAppMenu: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ListAllAppMenu'], values, signal),
  ListAllAppSubMenu: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ListAllAppSubMenu'], values, signal),
  GetOrganisationDetails: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.GetOrganisationDetails'], values, signal),
  ListOrganisationDetails: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ListOrganisationDetails'], values, signal),
  ApproveRejectUserdoc: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ApproveRejectUserdoc'], values, signal),
  GetAllUserConfigration: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.GetAllUserConfigration'], values, signal),
  UpdateUserconfiguration: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.UpdateUserconfiguration'], values, signal),
  ActivateDeactivateApiUser: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ActivateDeactivateApiUser'], values, signal),
  ActivateDeactivateUserMaster: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ActivateDeactivateUserMaster'], values, signal),
  GetAllUserMasterList: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.GetAllUserMasterList'], values, signal),
  ListUserAddress: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ListUserAddress'], values, signal),
  ChangePassword: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ChangePassword'], values, signal),
  AddIPAddress: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.AddIPAddress'], values, signal),
  GetallUserIPAddress: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.GetallUserIPAddress'], values, signal),
  ApproveRejectIP: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ApproveRejectIP'], values, signal),
  ListAllIPAddress: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ListAllIPAddress'], values, signal),
  ListApplicationForAdmin: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ListApplicationForAdmin'], values, signal),
  GetUserLogo: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.GetUserLogo'], values, signal),
  GetUserOtherDetails: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.GetUserOtherDetails'], values, signal),
  AddUserOtherDetails: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.AddUserOtherDetails'], values, signal),
  AddNewOutlet: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.AddNewOutlet'], values, signal),
  ListAllOutltes: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['UserMasterService.ListAllOutltes'], values, signal),
};
