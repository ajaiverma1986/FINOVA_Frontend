import { expect, it, vi } from 'vitest';
import { request } from '../core/api';
import { ReportService } from './ReportService';

vi.mock('../core/api', () => ({ request: vi.fn().mockResolvedValue({ Result: {} }) }));

it('posts the user report filters and abort signal to the documented endpoint', async () => {
  const body = { FreeTextSearch: 'alex', UserTypeId: 5, ParentId: 10, PageNumber: 2, PageSize: 20 };
  const signal = new AbortController().signal;
  await ReportService.getUserMasterListReport(body, signal);
  expect(request).toHaveBeenCalledWith('/Report/GetUserMasterListReport', {
    method: 'POST',
    body,
    signal,
  });
});

it('posts the user ledger report filters and abort signal to the documented endpoint', async () => {
  const body = { FromDate: '2025-01-01T00:00:00', ToDate: '2025-01-31T23:59:59', UserMasterId: 42 };
  const signal = new AbortController().signal;
  await ReportService.getUserLedgerReport(body, signal);
  expect(request).toHaveBeenCalledWith('/Report/GetUserLedgerReport', {
    method: 'POST',
    body,
    signal,
  });
});
