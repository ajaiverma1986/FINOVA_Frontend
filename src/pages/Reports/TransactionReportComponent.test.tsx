import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportService } from '../../services/ReportService';
import { OrgMgrService } from '../../services/OrgMgrService';
import { MasterDataService } from '../../services/MasterDataService';
import { UserMgrService } from '../../services/UserMgrservice';
import TransactionReportComponent from './TransactionReportComponent';
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
  vi.mocked(UserMgrService.getUserMasterByUserName).mockResolvedValue({
    Result: { UserMasterID: 99, UserTypeId: 2, UserName: 'admin' },
  });
  vi.mocked(UserMgrService.getUserMastersByUserTypeId).mockResolvedValue({
    Result: [{ UserMasterID: 10, UserName: 'MDS 1', UserTypeId: 3 }],
  });
  vi.mocked(UserMgrService.getUsersByParentId).mockImplementation(async (_, userTypeId) => ({
    Result:
      userTypeId === 4
        ? [{ UserMasterID: 20, UserName: 'DS 1', ParentId: 10, UserTypeId: 4 }]
        : [{ UserMasterID: 30, UserName: 'Agent 1', ParentId: 20, UserTypeId: 5 }],
  }));
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
  fireEvent.change(screen.getByLabelText('MDS'), { target: { value: '10' } });
  await waitFor(() =>
    expect((screen.getByLabelText('DS').querySelector('option[value="20"]') as HTMLOptionElement | null)).not.toBeNull(),
  );
  fireEvent.change(screen.getByLabelText('DS'), { target: { value: '20' } });
  await waitFor(() =>
    expect(
      (screen.getByLabelText('Retailer / Agent').querySelector('option[value="30"]') as HTMLOptionElement | null),
    ).not.toBeNull(),
  );
  fireEvent.change(screen.getByLabelText('Retailer / Agent'), { target: { value: '30' } });
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
  await waitFor(() =>
    expect((screen.getByRole('button', { name: 'Search' }) as HTMLButtonElement).disabled).toBe(
      false,
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await waitFor(() =>
    expect(ReportService.transactionDetailsReport).toHaveBeenLastCalledWith(
      expect.objectContaining({
        UserMasterId: 30,
        ServiceId: 8,
        AgencyId: 9,
        Status: 4,
        PageSize: 20,
      }),
      expect.any(AbortSignal),
    ),
  );
  await screen.findByText('TXN-1');
});
