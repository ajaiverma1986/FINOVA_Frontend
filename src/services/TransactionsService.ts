import { operationRequest } from '../core/api';
import { operations } from './operations';
import type { Fields } from '../core/types';

export const TransactionsService = {
  AddPayinRequest: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['TransactionsService.AddPayinRequest'], values, signal),
  ListPaymentResponse: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['TransactionsService.ListPaymentResponse'], values, signal),
  GetPayinRecieptFiles: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['TransactionsService.GetPayinRecieptFiles'], values, signal),
  ListPayinAccListResponse: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['TransactionsService.ListPayinAccListResponse'], values, signal),
  GetPayinAccChequeFiles: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['TransactionsService.GetPayinAccChequeFiles'], values, signal),
  ChangePayinRequestStatus: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['TransactionsService.ChangePayinRequestStatus'], values, signal),
  ListPayinAccListforAdminResponse: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(
      operations['TransactionsService.ListPayinAccListforAdminResponse'],
      values,
      signal,
    ),
  ApproveRejectPayinAccounts: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['TransactionsService.ApproveRejectPayinAccounts'], values, signal),
};
