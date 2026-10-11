import { request } from '../core/api';

export interface TransactionReportRequest {
  OrganizationId?: number | null;
  UserMasterId?: number | null;
  UserName?: string | null;
  TransactionId?: number | null;
  TransactionCode?: string | null;
  ServiceId?: number | null;
  AgencyId?: number | null;
  PartnerTxnId?: string | null;
  PartnerRetailorId?: string | null;
  RefNo?: string | null;
  TxnType?: string | null;
  Status?: number | null;
  TxnPlateform?: string | null;
  MinAmount?: number | null;
  MaxAmount?: number | null;
  FromDate?: string | null;
  ToDate?: string | null;
  PageNumber: number;
  PageSize: number;
  SortColumn?: string | null;
  SortDirection?: string | null;
}

export interface AdminDashboardRequest {
  UserMasterId?: number | null;
  ReportDate?: string | null;
}

export interface UserMasterListReportRequest {
  FromDate?: string | null;
  ToDate?: string | null;
  Status?: number | null;
  FreeTextSearch?: string | null;
  UserTypeId?: number | null;
  ParentId?: number | null;
  PageNumber: number;
  PageSize: number;
  SortColumn?: string | null;
  SortDirection?: string | null;
}

export const ReportService = {
  getUserMasterListReport: (body: UserMasterListReportRequest, signal?: AbortSignal) =>
    request('/Report/GetUserMasterListReport', { method: 'POST', body, signal }),
  transactionDetailsReport: (body: TransactionReportRequest, signal?: AbortSignal) =>
    request('/Report/TransactionDetailsReport', { method: 'POST', body, signal }),
  adminDashboard: (body: AdminDashboardRequest = {}, signal?: AbortSignal) =>
    request('/Report/AdminDashboard', { method: 'POST', body, signal }),
};
