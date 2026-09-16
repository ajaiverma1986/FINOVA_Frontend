import { operationRequest } from '../core/api';
import { operations } from './operations';
import type { Fields } from '../core/types';

export const ReportmanService = {
  PayoutTransactionReport: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['ReportmanService.PayoutTransactionReport'], values, signal),
  ListUserStatement: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['ReportmanService.ListUserStatement'], values, signal),
  GetTransactionSummaryByUserId: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['ReportmanService.GetTransactionSummaryByUserId'], values, signal),
  GetDayBookByUserId: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['ReportmanService.GetDayBookByUserId'], values, signal),
  GetallFirmDetail: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['ReportmanService.GetallFirmDetail'], values, signal),
};
