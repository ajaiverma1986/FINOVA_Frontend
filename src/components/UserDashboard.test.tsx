import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportService } from '../services/ReportService';
import { dashboardCards, type DashboardCardPermissions } from '../core/dashboardPermissions';
import { UserDashboard } from './UserDashboard';

vi.mock('../services/ReportService', () => ({ ReportService: { adminDashboard: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
function mount(
  cardPermissions: DashboardCardPermissions = Object.fromEntries(
    Object.keys(dashboardCards).map((id) => [id, true]),
  ),
) {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <UserDashboard userId={42} cardPermissions={cardPermissions} />
    </QueryClientProvider>,
  );
}
it('loads all sections from one user-scoped report and reloads when the date changes', async () => {
  vi.mocked(ReportService.adminDashboard).mockResolvedValue({
    Result: {
      Summary: { TotalTransactions: 12, TransactionAmount: 1250, TotalCommissionEarned: 50 },
      TransactionTrend: [{ ReportDate: '2026-09-20T00:00:00', TransactionCount: 12 }],
      TopTransactions: [{ TransactionCode: 'TXN-42', Amount: 1250 }],
      Daybook: [{ ServiceName: 'Bank transfer', TotalTransactions: 12 }],
    },
  });
  mount();
  await screen.findByText('TXN-42');
  expect(screen.getByText('Bank transfer')).toBeTruthy();
  expect(screen.getByText('₹50.00')).toBeTruthy();
  expect(screen.getByRole('img').getAttribute('aria-labelledby')).toBeTruthy();
  expect(ReportService.adminDashboard).toHaveBeenCalledTimes(1);
  expect(ReportService.adminDashboard).toHaveBeenCalledWith(
    expect.objectContaining({ UserMasterId: 42 }),
    expect.any(AbortSignal),
  );
  fireEvent.change(screen.getByLabelText('Report date'), { target: { value: '2026-09-19' } });
  await waitFor(() =>
    expect(ReportService.adminDashboard).toHaveBeenLastCalledWith(
      { UserMasterId: 42, ReportDate: '2026-09-19T00:00:00' },
      expect.any(AbortSignal),
    ),
  );
});
it('shows unavailable metrics for malformed responses instead of zero totals', async () => {
  vi.mocked(ReportService.adminDashboard).mockResolvedValue({ Result: {} });
  mount();
  await screen.findAllByText('The server returned an unexpected dashboard response.');
  expect(screen.getAllByText('Unavailable')).toHaveLength(3);
  expect(screen.queryByText('₹0.00')).toBeNull();
});

it('does not request report data when no cards are granted', async () => {
  mount({});
  expect(screen.getByText('No dashboard cards are enabled for your account.')).toBeTruthy();
  expect(ReportService.adminDashboard).not.toHaveBeenCalled();
});
it('renders only explicitly granted cards with stable IDs', async () => {
  vi.mocked(ReportService.adminDashboard).mockResolvedValue({
    Result: {
      Summary: { TotalTransactions: 1, TransactionAmount: 10, TotalCommissionEarned: 2 },
      TransactionTrend: [],
      TopTransactions: [],
      Daybook: [],
    },
  });
  mount({ 'dashboard-total-transactions': true, 'dashboard-daybook': false });
  await screen.findByText('1');
  expect(document.getElementById('dashboard-total-transactions')).not.toBeNull();
  expect(document.querySelectorAll('[data-card-id]')).toHaveLength(1);
  expect(screen.queryByText('Daybook')).toBeNull();
});
