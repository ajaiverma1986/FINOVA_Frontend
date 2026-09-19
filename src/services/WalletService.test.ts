import { afterEach, expect, it, vi } from 'vitest';
import { request } from '../core/api';
import { WalletService } from './WalletService';
vi.mock('../core/api', () => ({ request: vi.fn().mockResolvedValue({ Result: [] }) }));
afterEach(() => vi.clearAllMocks());

it('posts date filters, status, and server pagination to Wallet search', async () => {
  const signal = new AbortController().signal;
  const body = {
    FromDate: '2026-09-19T00:00:00',
    ToDate: '2026-09-19T23:59:59.999',
    Status: 1,
    PaymentChanelID: 4,
    PaymentModeId: 5,
    PageNumber: 2,
    PageSize: 20,
  };
  await WalletService.searchPayinRequests(body, signal);
  expect(request).toHaveBeenCalledWith('/Wallet/SearchPayinRequests', {
    method: 'POST',
    body,
    signal,
  });
});

it.each([2, 3] as const)('maps status %s to the documented Wallet action', async (Status) => {
  const body = {
    RequestID: 42,
    Status,
    RejectedReason: Status === 3 ? 'Receipt does not match' : null,
  };
  await WalletService.approveRejectPayinRequest(body);
  expect(request).toHaveBeenCalledWith('/Wallet/ApproveRejectPayinRequest', {
    method: 'POST',
    body: {
      RequestID: 42,
      Action: Status === 2 ? 'APPROVE' : 'REJECT',
      RejectedReason: body.RejectedReason,
    },
    signal: undefined,
  });
});

it('uses multipart company account uploads', async () => {
  const File = new globalThis.File(['document'], 'bank.pdf', { type: 'application/pdf' });
  await WalletService.updateCompanyAccount({
    CompanyAccountId: 12,
    OrganizationId: 1,
    ApplicationId: 2,
    BankId: 3,
    File,
    Status: 1,
  });
  const body = vi.mocked(request).mock.calls[0][1]?.body as FormData;
  expect(body.get('CompanyAccountId')).toBe('12');
  expect(body.get('File')).toBe(File);
});
