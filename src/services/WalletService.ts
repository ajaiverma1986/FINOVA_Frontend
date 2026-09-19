import { request } from '../core/api';

export interface SearchPayinRequest {
  UserMasterId?: number | null;
  UserName?: string | null;
  Status?: number | null;
  PaymentChanelID?: number | null;
  PaymentModeId?: number | null;
  RequestID?: number | null;
  RefNo?: string | null;
  FromDate?: string | null;
  ToDate?: string | null;
  PageNumber: number;
  PageSize: number;
}

export interface ApproveRejectPayinRequest {
  RequestID: number;
  Status: 2 | 3;
  RejectedReason: string | null;
}

export interface CreatePayinRequest {
  UserMasterId: number;
  PaymentChanelID: number;
  PaymentModeId: number;
  Amount: number;
  Charge: number;
  OriginatorAccountId?: number | null;
  BenficiaryAccountId?: number | null;
  DepositDate?: string | null;
  RefNo1?: string | null;
  RefNo2?: string | null;
  Remarks?: string | null;
  RecieptFileurl?: string | null;
  Status: number;
}

export interface CompanyAccountRequest {
  OrganizationId: number;
  ApplicationId: number;
  BankId: number;
  AccountType?: string | null;
  AccountName?: string | null;
  AccountNo?: string | null;
  Ifsccode?: string | null;
  BranchName?: string | null;
  BranchCode?: string | null;
  BranchAddress?: string | null;
  Remarks?: string | null;
  File?: File | null;
  Status: number;
}

function companyAccountForm(body: CompanyAccountRequest & { CompanyAccountId?: number }) {
  const form = new FormData();
  Object.entries(body).forEach(([key, value]) => {
    if (value != null) form.append(key, value instanceof File ? value : String(value));
  });
  return form;
}

const get = (endpoint: string, values: Record<string, number> = {}, signal?: AbortSignal) => {
  const query = new URLSearchParams(
    Object.entries(values).map(([key, value]) => [key, String(value)]),
  );
  return request(`/Wallet/${endpoint}${query.size ? `?${query}` : ''}`, { method: 'GET', signal });
};

export const WalletService = {
  searchPayinRequests: (body: SearchPayinRequest, signal?: AbortSignal) =>
    request('/Wallet/SearchPayinRequests', { method: 'POST', body, signal }),
  approveRejectPayinRequest: (body: ApproveRejectPayinRequest, signal?: AbortSignal) =>
    request('/Wallet/ApproveRejectPayinRequest', {
      method: 'POST',
      // WalletProvider accepts Action; numeric statuses remain internal to the UI.
      body: {
        RequestID: body.RequestID,
        Action: body.Status === 2 ? 'APPROVE' : 'REJECT',
        RejectedReason: body.Status === 2 ? null : body.RejectedReason,
      },
      signal,
    }),
  createPayinRequest: (body: CreatePayinRequest, signal?: AbortSignal) =>
    request('/Wallet/CreatePayinRequest', { method: 'POST', body, signal }),
  getPayinRequestById: (requestID: number, signal?: AbortSignal) =>
    get('GetPayinRequestByID', { requestID }, signal),
  getAllPayinRequests: (signal?: AbortSignal) => get('GetAllPayinRequests', {}, signal),
  getPayinRequestsByUserMasterId: (userMasterId: number, signal?: AbortSignal) =>
    get('GetPayinRequestsByUserMasterID', { userMasterId }, signal),
  getPayinRequestsByStatus: (status: number, signal?: AbortSignal) =>
    get('GetPayinRequestsByStatus', { status }, signal),
  createCompanyAccount: (body: CompanyAccountRequest, signal?: AbortSignal) =>
    request('/Wallet/CreateCompanyAccount', {
      method: 'POST',
      body: companyAccountForm(body),
      signal,
    }),
  updateCompanyAccount: (
    body: CompanyAccountRequest & { CompanyAccountId: number },
    signal?: AbortSignal,
  ) =>
    request('/Wallet/UpdateCompanyAccount', {
      method: 'POST',
      body: companyAccountForm(body),
      signal,
    }),
  deleteCompanyAccount: (companyAccountId: number, signal?: AbortSignal) =>
    request(`/Wallet/DeleteCompanyAccount/${encodeURIComponent(String(companyAccountId))}`, {
      method: 'DELETE',
      signal,
    }),
  getCompanyAccountById: (companyAccountId: number, signal?: AbortSignal) =>
    get('GetCompanyAccountByID', { companyAccountId }, signal),
  getAllCompanyAccounts: (signal?: AbortSignal) => get('GetAllCompanyAccounts', {}, signal),
  getActiveCompanyAccounts: (signal?: AbortSignal) => get('GetActiveCompanyAccounts', {}, signal),
  getCompanyAccountsByOrganizationId: (organizationId: number, signal?: AbortSignal) =>
    get('GetCompanyAccountsByOrganizationId', { organizationId }, signal),
  getCompanyAccountsByApplicationId: (applicationId: number, signal?: AbortSignal) =>
    get('GetCompanyAccountsByApplicationId', { applicationId }, signal),
  getCompanyAccountsByOrganizationApplication: (
    organizationId: number,
    applicationId: number,
    signal?: AbortSignal,
  ) =>
    get('GetCompanyAccountsByOrganizationApplication', { organizationId, applicationId }, signal),
};
