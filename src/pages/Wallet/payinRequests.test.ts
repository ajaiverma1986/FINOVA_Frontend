import { expect, it } from 'vitest';
import { payinPage, searchBody } from './payinRequests';

it('reads the Wallet Records/Paging response instead of the envelope default count', () => {
  const result = payinPage({
    TotalRecords: 0,
    Result: {
      Records: [{ RequestID: 7 }],
      Paging: { TotalRecords: 41, TotalPages: 3, PageNumber: 3, PageSize: 20 },
    },
  });
  expect(result).toEqual({ rows: [{ RequestID: 7 }], total: 41 });
});

it('keeps whole local dates including the end of the selected day', () => {
  expect(
    searchBody({ from: '2026-09-01', to: '2026-09-02', status: '1', channel: '', mode: '' }, 2),
  ).toEqual({
    FromDate: '2026-09-01T00:00:00',
    ToDate: '2026-09-02T23:59:59.999',
    Status: 1,
    PaymentChanelID: null,
    PaymentModeId: null,
    PageNumber: 2,
    PageSize: 20,
  });
});
