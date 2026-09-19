import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PayinRequestListComponent from './PayinRequestListComponent';
import { WalletService } from '../../services/WalletService';
import { MasterDataService } from '../../services/MasterDataService';
import { exportToExcel } from '../../core/exportToExcel';
import { PAYIN_STATUS, today } from './payinRequests';

vi.mock('../../core/exportToExcel', () => ({ exportToExcel: vi.fn() }));
const row = (id: number, status: number = PAYIN_STATUS.pending) => ({
  RequestID: id,
  Status: status,
  Amount: 100,
  UserName: `User ${id}`,
  RecieptFileurl: `/uploads/receipt-${id}.jpg`,
});
beforeEach(() => {
  vi.spyOn(MasterDataService, 'getActivePaymentChanels').mockResolvedValue({
    Result: [
      { PaymentChanelID: 4, PaymentChanelName: 'Bank transfer' },
      { PaymentChanelID: 5, PaymentChanelName: 'Cash' },
    ],
  });
  vi.spyOn(MasterDataService, 'getActivePaymentModes').mockResolvedValue({
    Result: [
      { PaymentModeID: 6, PaymentChanelID: 4, PaymentModeName: 'NEFT' },
      { PaymentModeID: 7, PaymentChanelID: 5, PaymentModeName: 'Cash deposit' },
    ],
  });
  vi.spyOn(WalletService, 'searchPayinRequests').mockResolvedValue({
    Result: [row(1), row(2)],
    TotalRecords: 2,
  });
  vi.spyOn(WalletService, 'approveRejectPayinRequest').mockResolvedValue({ Result: {} });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(
    <QueryClientProvider client={client}>
      <PayinRequestListComponent />
    </QueryClientProvider>,
  );
}

it('defaults to today and pending, applies dates and master filters, and resets payment mode', async () => {
  setup();
  await screen.findByText('User 1');
  expect((screen.getByLabelText('From date') as HTMLInputElement).value).toBe(today());
  expect((screen.getByLabelText('To date') as HTMLInputElement).value).toBe(today());
  expect(WalletService.searchPayinRequests).toHaveBeenCalledWith(
    expect.objectContaining({
      FromDate: `${today()}T00:00:00`,
      ToDate: `${today()}T23:59:59.999`,
      Status: PAYIN_STATUS.pending,
      PageNumber: 1,
      PageSize: 20,
    }),
    expect.any(AbortSignal),
  );
  await screen.findByRole('option', { name: 'NEFT' });
  fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-09-01' } });
  fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-09-02' } });
  fireEvent.change(screen.getByLabelText('Payment channel'), { target: { value: '4' } });
  expect(screen.queryByRole('option', { name: 'Cash deposit' })).toBeNull();
  fireEvent.change(screen.getByLabelText('Payment mode'), { target: { value: '6' } });
  fireEvent.submit(screen.getByRole('form', { name: 'Search pay-in requests' }));
  await waitFor(() =>
    expect(WalletService.searchPayinRequests).toHaveBeenLastCalledWith(
      expect.objectContaining({
        FromDate: '2026-09-01T00:00:00',
        ToDate: '2026-09-02T23:59:59.999',
        PaymentChanelID: 4,
        PaymentModeId: 6,
      }),
      expect.any(AbortSignal),
    ),
  );
  fireEvent.change(screen.getByLabelText('Payment channel'), { target: { value: '5' } });
  expect((screen.getByLabelText('Payment mode') as HTMLSelectElement).value).toBe('');
});

it('paginates 20 at a time and clears page selections', async () => {
  vi.mocked(WalletService.searchPayinRequests).mockImplementation(async (body) => ({
    Result: {
      Records: body.PageNumber === 1 ? Array.from({ length: 20 }, (_, i) => row(i + 1)) : [row(21)],
      Paging: { TotalRecords: 21, TotalPages: 2 },
    },
    TotalRecords: 0,
  }));
  setup();
  await screen.findByText('User 20');
  expect(
    within(screen.getByRole('table', { name: 'Pay-in requests' })).getAllByRole('row'),
  ).toHaveLength(21);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select request 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByText('User 21');
  expect(screen.queryByText('User 1')).toBeNull();
  expect((screen.getByRole('button', { name: 'Approve' }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  expect(WalletService.searchPayinRequests).toHaveBeenLastCalledWith(
    expect.objectContaining({ PageNumber: 2, PageSize: 20 }),
    expect.any(AbortSignal),
  );
});

it('selects single or all pending records and approves each with a null reason', async () => {
  vi.mocked(WalletService.searchPayinRequests).mockResolvedValue({
    Result: [row(1), row(2), row(3, PAYIN_STATUS.approved)],
    TotalRecords: 3,
  });
  setup();
  await screen.findByText('User 1');
  expect((screen.getByRole('button', { name: 'Approve' }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select request 1' }));
  expect(screen.getByText('1 selected on this page')).toBeDefined();
  fireEvent.click(
    screen.getByRole('checkbox', { name: 'Select all pending requests on this page' }),
  );
  expect(screen.getByText('2 selected on this page')).toBeDefined();
  expect(
    (screen.getByRole('checkbox', { name: 'Select request 3' }) as HTMLInputElement).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
  await screen.findByText('2 requests approved.');
  expect(WalletService.approveRejectPayinRequest).toHaveBeenCalledTimes(2);
  expect(WalletService.approveRejectPayinRequest).toHaveBeenCalledWith({
    RequestID: 1,
    Status: 2,
    RejectedReason: null,
  });
  expect(WalletService.approveRejectPayinRequest).toHaveBeenCalledWith({
    RequestID: 2,
    Status: 2,
    RejectedReason: null,
  });
});

it('requires a nonblank reason before rejecting', async () => {
  setup();
  await screen.findByText('User 1');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select request 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
  const dialog = screen.getByRole('dialog', { name: 'Reject selected requests' });
  fireEvent.change(within(dialog).getByLabelText('Rejected reason'), { target: { value: '   ' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm rejection' }));
  expect(await screen.findByText('Rejected reason is required.')).toBeDefined();
  expect(WalletService.approveRejectPayinRequest).not.toHaveBeenCalled();
  fireEvent.change(within(dialog).getByLabelText('Rejected reason'), {
    target: { value: '  Incorrect receipt  ' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm rejection' }));
  await screen.findByText('1 request rejected.');
  expect(WalletService.approveRejectPayinRequest).toHaveBeenCalledWith({
    RequestID: 1,
    Status: 3,
    RejectedReason: 'Incorrect receipt',
  });
});

it('reports partial failures without retrying successful approvals', async () => {
  vi.mocked(WalletService.approveRejectPayinRequest)
    .mockResolvedValueOnce({})
    .mockRejectedValueOnce(new Error('Already processed'));
  setup();
  await screen.findByText('User 1');
  fireEvent.click(
    screen.getByRole('checkbox', { name: 'Select all pending requests on this page' }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
  await screen.findByText('1 request approved.');
  expect(await screen.findByText('#2: Already processed')).toBeDefined();
  expect(WalletService.approveRejectPayinRequest).toHaveBeenCalledTimes(2);
});

it('opens receipt previews from the last grid column', async () => {
  setup();
  await screen.findByText('User 1');
  fireEvent.click(screen.getAllByRole('button', { name: 'View document' })[0]);
  expect(await screen.findByRole('dialog', { name: 'Pay-in request 1 document' })).toBeDefined();
  expect(screen.getByRole('img').getAttribute('src')).toContain('/uploads/receipt-1.jpg');
});

it('exports all matching pages, not only the visible page', async () => {
  vi.mocked(WalletService.searchPayinRequests).mockImplementation(async (body) => ({
    Result: body.PageNumber === 1 ? Array.from({ length: 20 }, (_, i) => row(i + 1)) : [row(21)],
    TotalRecords: 21,
  }));
  setup();
  await screen.findByText('User 20');
  fireEvent.click(screen.getByRole('button', { name: 'Export to Excel' }));
  await waitFor(() => expect(exportToExcel).toHaveBeenCalledOnce());
  expect(vi.mocked(exportToExcel).mock.calls[0][2]).toHaveLength(21);
  expect(vi.mocked(exportToExcel).mock.calls[0][2][20]['Request ID']).toBe(21);
});
