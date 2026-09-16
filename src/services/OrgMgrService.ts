import { request } from '../core/api';

export interface CreateOrganizationRequest {
  OrganizationCode?: string | null;
  OrganizationName?: string | null;
  OrganizationTypeID?: number | null;
  DisplayName?: string | null;
  LegalName?: string | null;
  Email?: string | null;
  MobileNo?: string | null;
  PhoneNo?: string | null;
  Website?: string | null;
  RegistrationNo?: string | null;
  GSTIN?: string | null;
  PAN?: string | null;
  TAN?: string | null;
  LogoPath?: string | null;
  CurrencyID?: number | null;
  TimeZoneID?: number | null;
  Status: number;
}

export interface UpdateOrganizationRequest extends CreateOrganizationRequest {
  OrganizationID: number;
}

export const OrgMgrService = {
  createOrganization: (values: CreateOrganizationRequest, signal?: AbortSignal) =>
    request('/OrgMgr/CreateOrganization', { method: 'POST', body: values, signal }),
  updateOrganization: (values: UpdateOrganizationRequest, signal?: AbortSignal) =>
    request('/OrgMgr/UpdateOrganization', { method: 'POST', body: values, signal }),
  deleteOrganization: (organizationID: number, signal?: AbortSignal) =>
    request(`/OrgMgr/DeleteOrganization/${encodeURIComponent(organizationID)}`, {
      method: 'DELETE',
      signal,
    }),
  getOrganizationById: (organizationID: number, signal?: AbortSignal) =>
    request(`/OrgMgr/GetOrganizationByID?organizationID=${encodeURIComponent(organizationID)}`, {
      signal,
    }),
  getOrganizationByUid: (organizationUID: string, signal?: AbortSignal) =>
    request(`/OrgMgr/GetOrganizationByUID?organizationUID=${encodeURIComponent(organizationUID)}`, {
      signal,
    }),
  getOrganizationByCode: (organizationCode: string, signal?: AbortSignal) =>
    request(
      `/OrgMgr/GetOrganizationByCode?organizationCode=${encodeURIComponent(organizationCode)}`,
      {
        signal,
      },
    ),
  getAllOrganizations: (signal?: AbortSignal) => request('/OrgMgr/GetAllOrganizations', { signal }),
  getActiveOrganizations: (signal?: AbortSignal) =>
    request('/OrgMgr/GetActiveOrganizations', { signal }),
  getOrganizationsByOrganizationTypeId: (organizationTypeID: number, signal?: AbortSignal) =>
    request(
      `/OrgMgr/GetOrganizationsByOrganizationTypeID?organizationTypeID=${encodeURIComponent(organizationTypeID)}`,
      { signal },
    ),
};
