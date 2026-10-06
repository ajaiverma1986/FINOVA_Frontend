import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportService } from '../../services/ReportService';
import { OrgMgrService } from '../../services/OrgMgrService';
import { MasterDataService } from '../../services/MasterDataService';
import TransactionReportComponent from './TransactionReportComponent';
vi.mock('../../services/ReportService', () => ({
  ReportService: { transactionDetailsReport: vi.fn() },
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});
it('submits filters, follows server pagination, and resets the page after searching', async () => {
  vi.spyOn(OrgMgrService, 'getActiveOrganizations').mockResolvedValue({
    Result: [{ OrganizationID: 7, OrganizationName: 'Example company' }],
  });
  vi.spyOn(MasterDataService, 'getAllServices').mockResolvedValue({
    Result: [{ ServiceID: 8, ServiceName: 'Payout' }],
  });
  vi.spyOn(MasterDataService, 'getActiveAgencies').mockResolvedValue({
    Result: [{ AgencyID: 9, AgencyName: 'Example agency' }],
  });
  vi.mocked(ReportService.transactionDetailsReport).mockImplementation(async (body) => ({
    Result: {
      Records: [{ TransactionId: body.PageNumber, TransactionCode: `TXN-${body.PageNumber}` }],
      Paging: { TotalRecords: 25, TotalPages: 2, HasNextPage: body.PageNumber === 1 },
    },
  }));
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <TransactionReportComponent />
    </QueryClientProvider>,
  );
  await screen.findByText('TXN-1');
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByText('TXN-2');
  fireEvent.change(screen.getByLabelText('User name'), { target: { value: 'retailer' } });
  fireEvent.change(screen.getByLabelText('Organization'), { target: { value: '7' } });
  fireEvent.change(screen.getByLabelText('Service'), { target: { value: '8' } });
  fireEvent.change(screen.getByLabelText('Agency'), { target: { value: '9' } });
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: '4' } });
  for (const name of [
    'Partner retailer ID',
    'User ID',
    'Transaction type',
    'Platform',
    'Minimum amount',
  ])
    expect(screen.queryByLabelText(name)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await waitFor(() =>
    expect(ReportService.transactionDetailsReport).toHaveBeenLastCalledWith(
      expect.objectContaining({
        UserName: 'retailer',
        OrganizationId: 7,
        ServiceId: 8,
        AgencyId: 9,
        Status: 4,
        PageNumber: 1,
        PageSize: 20,
      }),
      expect.any(AbortSignal),
    ),
  );
  await screen.findByText('TXN-1');
});
