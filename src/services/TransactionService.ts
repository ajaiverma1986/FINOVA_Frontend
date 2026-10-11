import { request } from '../core/api';

export interface NewTransactionRequest {
  OrganizationId: number;
  UserMasterId: number;
  ServiceId: number;
  AgencyId: number;
  PartnerTxnId?: string | null;
  PartnerRetailorId?: string | null;
  Description?: string | null;
  TxnType?: string | null;
  Amount: number;
  TxnFee: number;
  Margin: number;
  TxnPlateform?: string | null;
}

export const TransactionService = {
  createNewTransaction: (body: NewTransactionRequest, signal?: AbortSignal) =>
    request('/Transaction/CreateNewTransaction', { method: 'POST', body, signal }),
};
