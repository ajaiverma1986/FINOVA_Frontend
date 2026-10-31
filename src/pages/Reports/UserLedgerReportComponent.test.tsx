import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportService } from '../../services/ReportService';
import { UserMgrService } from '../../services/UserMgrservice';
import UserLedgerReportComponent from './UserLedgerReportComponent';
vi.mock('../../core/auth', () => ({
  useAuth: () => ({
    session: {
      token: 'token',
      username: 'admin',
      displayName: 'Admin',
      userTypeId: 2,
      expiresAt: Date.now() + 60000,
    },
  }),
}));
vi.mock('../../services/UserMgrservice', () => ({
  UserMgrService: {
    getUserMasterByUserName: vi.fn(),
    getUserMastersByUserTypeId: vi.fn(),
    getUsersByParentId: vi.fn(),
  },
}));
vi.mock('../../services/ReportService', () => ({
  ReportService: { getUserLedgerReport: vi.fn() },
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});
it('cascades user lists and submits only the selected agent as UserMasterId', async () => {
  vi.mocked(UserMgrService.getUserMasterByUserName).mockResolvedValue({
    Result: { UserMasterID: 99, UserTypeId: 2 },
  });
  vi.mocked(UserMgrService.getUserMastersByUserTypeId).mockResolvedValue({
    Result: [{ UserMasterID: 10, UserName: 'MDS 1' }],
  });
  vi.mocked(UserMgrService.getUsersByParentId).mockImplementation(async (_, type) => ({
    Result:
      type === 4
        ? [{ UserMasterID: 20, UserName: 'DS 1', ParentId: 10 }]
        : [{ UserMasterID: 30, UserName: 'Agent 1', ParentId: 20 }],
  }));
  vi.mocked(ReportService.getUserLedgerReport).mockResolvedValue({
    Result: [
      {
        LedgerId: 5,
        UserMasterId: 30,
        UserName: 'Demo Agent',
        LedgerDate: '2026-10-25T10:56:32.833',
        LedgerTypeId: 4,
        LedgerTypeName: 'Commission',
        Naration: 'Commission credited',
        DebitAmount: 0,
        CreditAmount: 0.125,
      },
    ],
  });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <UserLedgerReportComponent />
    </QueryClientProvider>,
  );
  await screen.findByRole('table', { name: 'User ledger report' });
  expect(screen.queryByRole('columnheader', { name: /UserMasterId|LedgerTypeId/ })).toBeNull();
  expect(screen.getByRole('columnheader', { name: 'Credit amount' })).toBeTruthy();
  expect(screen.getByText('25/10/2026 10:56:32')).toBeTruthy();
  expect(within(screen.getByRole('table')).getByText('0.125')).toBeTruthy();
  expect(screen.queryByLabelText('User master ID')).toBeNull();
  await screen.findByRole('option', { name: '[MDS 1]' });
  fireEvent.change(screen.getByLabelText('MDS'), { target: { value: '10' } });
  await screen.findByRole('option', { name: '[DS 1]' });
  fireEvent.change(screen.getByLabelText('DS'), { target: { value: '20' } });
  await screen.findByRole('option', { name: '[Agent 1]' });
  fireEvent.change(screen.getByLabelText('Retailer / Agent'), { target: { value: '30' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await waitFor(() =>
    expect(ReportService.getUserLedgerReport).toHaveBeenLastCalledWith(
      expect.objectContaining({ UserMasterId: 30 }),
      expect.any(AbortSignal),
    ),
  );
  fireEvent.change(screen.getByLabelText('MDS'), { target: { value: '' } });
  expect((screen.getByLabelText('DS') as HTMLSelectElement).value).toBe('');
  expect((screen.getByLabelText('Retailer / Agent') as HTMLSelectElement).value).toBe('');
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await waitFor(() =>
    expect(ReportService.getUserLedgerReport).toHaveBeenLastCalledWith(
      expect.objectContaining({ UserMasterId: null }),
      expect.any(AbortSignal),
    ),
  );
});

it.each([
  {
    rows: [
      { DebitAmount: 100, CreditAmount: '25.125' },
      { DebitAmount: '20.5', CreditAmount: 5 },
    ],
    expected: ['120.50', '30.125', '-90.375'],
  },
  { rows: [], expected: ['0.00', '0.00', '0.00'] },
  {
    rows: [
      { DebitAmount: null, CreditAmount: 0.1 },
      { DebitAmount: 0, CreditAmount: 0.2 },
    ],
    expected: ['0.00', '0.30', '0.30'],
  },
])('shows ledger totals for the returned entries: $expected', async ({ rows, expected }) => {
  vi.mocked(UserMgrService.getUserMasterByUserName).mockResolvedValue({ Result: {} });
  vi.mocked(UserMgrService.getUserMastersByUserTypeId).mockResolvedValue({ Result: [] });
  vi.mocked(ReportService.getUserLedgerReport).mockResolvedValue({ Result: rows });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <UserLedgerReportComponent />
    </QueryClientProvider>,
  );
  const totals = await screen.findByLabelText('Ledger totals');
  expect(Array.from(totals.querySelectorAll('dd'), (cell) => cell.textContent)).toEqual(expected);
});

it('pages ledger entries, preserves full-report totals, and resets paging on search', async () => {
  vi.mocked(UserMgrService.getUserMasterByUserName).mockResolvedValue({ Result: {} });
  vi.mocked(UserMgrService.getUserMastersByUserTypeId).mockResolvedValue({ Result: [] });
  vi.mocked(ReportService.getUserLedgerReport).mockResolvedValue({
    Result: Array.from({ length: 25 }, (_, index) => ({
      LedgerId: index + 1,
      UserName: `Entry ${index + 1}`,
      DebitAmount: 1,
      CreditAmount: 2,
    })),
  });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <UserLedgerReportComponent />
    </QueryClientProvider>,
  );
  await screen.findByRole('table', { name: 'User ledger report' });
  const table = screen.getByRole('table');
  const totals = screen.getByLabelText('Ledger totals');
  expect(Array.from(totals.querySelectorAll('dd'), (cell) => cell.textContent)).toEqual([
    '25.00',
    '50.00',
    '25.00',
  ]);
  expect(within(table).getAllByRole('row')).toHaveLength(11);
  expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(within(table).getByText('Entry 11')).toBeTruthy();
  expect(within(table).queryByText('Entry 1')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(within(table).getAllByRole('row')).toHaveLength(6);
  expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Rows per page'), { target: { value: '20' } });
  expect(screen.getByText('Page 1 of 2')).toBeTruthy();
  expect(within(table).getAllByRole('row')).toHaveLength(21);
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  expect(screen.getByText('Page 1 of 2')).toBeTruthy();
  expect(within(table).getByText('Entry 1')).toBeTruthy();
  expect(Array.from(totals.querySelectorAll('dd'), (cell) => cell.textContent)).toEqual([
    '25.00',
    '50.00',
    '25.00',
  ]);
});

it('shows credit for Dr / Cr 1 and debit for other values with matching badge colors', async () => {
  vi.mocked(UserMgrService.getUserMasterByUserName).mockResolvedValue({ Result: {} });
  vi.mocked(UserMgrService.getUserMastersByUserTypeId).mockResolvedValue({ Result: [] });
  vi.mocked(ReportService.getUserLedgerReport).mockResolvedValue({
    Result: [
      { LedgerId: 1, DbCr: 1 },
      { LedgerId: 2, DbCr: '1' },
      { LedgerId: 3, DbCr: 2 },
      { LedgerId: 4, DbCr: 0 },
    ],
  });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <UserLedgerReportComponent />
    </QueryClientProvider>,
  );
  const table = await screen.findByRole('table', { name: 'User ledger report' });
  const credits = within(table).getAllByText('Credit');
  const debits = within(table).getAllByText('Debit');
  expect(credits).toHaveLength(2);
  expect(debits).toHaveLength(2);
  credits.forEach((badge) => expect(badge.classList.contains('ledger-credit')).toBe(true));
  debits.forEach((badge) => expect(badge.classList.contains('ledger-debit')).toBe(true));
});
