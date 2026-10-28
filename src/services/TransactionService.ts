import { request } from '../core/api';

export interface NewTransactionRequest {
  OrganizationId?: number;
  UserMasterId?: number;
  ServiceId?: number;
  AgencyId?: number;
  PartnerTxnId?: string | null;
  PartnerRetailorId?: string | null;
  Description?: string | null;
  TxnType?: string | null;
  Amount?: number;
  TxnFee?: number;
  Margin?: number;
  TxnPlateform?: string | null;
}

export interface UpdateTransactionStatusRequest {
  TransactionId: number;
  RelatedReference?: string | null;
  RefNo1?: string | null;
  RefNo2?: string | null;
  RefNo3?: string | null;
  RefNo4?: string | null;
  RefNo5?: string | null;
  RefNo6?: string | null;
  RefNo7?: string | null;
  RefNo8?: string | null;
  RefNo9?: string | null;
  Status: number;
}

export const TransactionService = {
  createNewTransaction: (body: NewTransactionRequest, signal?: AbortSignal) =>
    request<unknown>('/Transaction/CreateNewTransaction', { method: 'POST', body, signal }),
  updateTransactionStatus: (body: UpdateTransactionStatusRequest, signal?: AbortSignal) =>
    request<unknown>('/Transaction/UpdateTransactionStatus', { method: 'POST', body, signal }),
};
