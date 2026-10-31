import { afterEach, expect, it, vi } from 'vitest';
import { request } from '../core/api';
import { TransactionService } from './TransactionService';

vi.mock('../core/api', () => ({ request: vi.fn().mockResolvedValue({ Result: {} }) }));
afterEach(() => vi.clearAllMocks());

it('posts the Swagger create-transaction contract to its endpoint', async () => {
  const body = {
    OrganizationId: 1,
    UserMasterId: 2,
    ServiceId: 3,
    AgencyId: 4,
    PartnerTxnId: 'partner-1',
    PartnerRetailorId: null,
    Description: 'Test transaction',
    TxnType: 'DMT',
    Amount: 100,
    TxnFee: 2,
    Margin: 1,
    TxnPlateform: 'web',
  };
  const signal = new AbortController().signal;

  await TransactionService.createNewTransaction(body, signal);

  expect(request).toHaveBeenCalledWith('/Transaction/CreateNewTransaction', {
    method: 'POST',
    body,
    signal,
  });
});

it('posts the selected status and null reference values to its endpoint', async () => {
  const body = {
    TransactionId: 42,
    RelatedReference: null,
    RefNo1: null,
    RefNo2: null,
    RefNo3: null,
    RefNo4: null,
    RefNo5: null,
    RefNo6: null,
    RefNo7: null,
    RefNo8: null,
    RefNo9: null,
    Status: 2,
  };

  await TransactionService.updateTransactionStatus(body);

  expect(request).toHaveBeenCalledWith('/Transaction/UpdateTransactionStatus', {
    method: 'POST',
    body,
    signal: undefined,
  });
});
