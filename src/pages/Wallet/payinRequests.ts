import type { ApiResponse } from '../../core/types';
import type { SearchPayinRequest } from '../../services/WalletService';

export type PayinRow = Record<string, unknown>;
export const PAGE_SIZE = 20;
export const PAYIN_STATUS = { pending: 1, approved: 2, rejected: 3 } as const;
export const statusOptions = [
  { id: PAYIN_STATUS.pending, name: 'Pending' },
  { id: PAYIN_STATUS.approved, name: 'Approved' },
  { id: PAYIN_STATUS.rejected, name: 'Rejected' },
];
export function value(row: PayinRow, key: string): unknown {
  return row[Object.keys(row).find((name) => name.toLowerCase() === key.toLowerCase()) ?? key];
}
export function records(result: unknown): PayinRow[] {
  if (Array.isArray(result)) return result.filter((row) => row && typeof row === 'object');
  if (!result || typeof result !== 'object') return [];
  const list = Object.values(result).find(Array.isArray);
  return list ? records(list) : [];
}
export function payinPage(response: ApiResponse) {
  const rows = records(response.Result);
  const nested =
    response.Result && !Array.isArray(response.Result) && typeof response.Result === 'object'
      ? (response.Result as PayinRow)
      : {};
  const paging = value(nested, 'Paging');
  const rawTotal =
    (paging && typeof paging === 'object'
      ? value(paging as PayinRow, 'TotalRecords')
      : undefined) ??
    value(response, 'TotalRecords') ??
    value(nested, 'TotalRecords') ??
    value(nested, 'TotalCount') ??
    value(rows[0] ?? {}, 'TotalRecords');
  const total =
    rawTotal != null && Number.isFinite(Number(rawTotal)) ? Math.max(0, Number(rawTotal)) : null;
  return { rows: rows.slice(0, PAGE_SIZE), total };
}
export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export type PayinFilters = {
  from: string;
  to: string;
  status: string;
  channel: string;
  mode: string;
};
export function initialFilters(): PayinFilters {
  return {
    from: today(),
    to: today(),
    status: String(PAYIN_STATUS.pending),
    channel: '',
    mode: '',
  };
}
export function searchBody(filters: PayinFilters, page: number): SearchPayinRequest {
  return {
    FromDate: `${filters.from}T00:00:00`,
    ToDate: `${filters.to}T23:59:59.999`,
    Status: filters.status ? Number(filters.status) : null,
    PaymentChanelID: filters.channel ? Number(filters.channel) : null,
    PaymentModeId: filters.mode ? Number(filters.mode) : null,
    PageNumber: page,
    PageSize: PAGE_SIZE,
  };
}
export const columns = [
  ['RequestID', 'Request ID'],
  ['UserName', 'User name'],
  ['CreatedOn', 'Request date'],
  ['DepositDate', 'Deposit date'],
  ['PaymentChanelName', 'Payment channel'],
  ['PaymentModeName', 'Payment mode'],
  ['Amount', 'Amount'],
  ['Charge', 'Charge'],
  ['RefNo1', 'Reference 1'],
  ['RefNo2', 'Reference 2'],
  ['StatusName', 'Status'],
  ['RejectedReason', 'Rejected reason'],
  ['Remarks', 'Remarks'],
] as const;
export function cell(row: PayinRow, key: string) {
  if (key === 'StatusName')
    return String(
      value(row, key) ||
        statusOptions.find((option) => option.id === Number(value(row, 'Status')))?.name ||
        value(row, 'Status') ||
        '',
    );
  return value(row, key) ?? '';
}
export function documentUrl(row: PayinRow) {
  return String(
    value(row, 'RecieptFileurl') || value(row, 'ReceiptFileUrl') || value(row, 'FileUrl') || '',
  );
}
