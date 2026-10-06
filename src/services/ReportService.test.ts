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
