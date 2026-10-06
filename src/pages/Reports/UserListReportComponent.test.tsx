import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportService } from '../../services/ReportService';
import { MasterDataService } from '../../services/MasterDataService';
import UserListReportComponent from './UserListReportComponent';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function setup() {
  vi.spyOn(MasterDataService, 'getActiveUserTypes').mockResolvedValue({
    Result: [{ UserTypeId: 5, UserTypeName: 'Retailer' }],
  });
  const report = vi
    .spyOn(ReportService, 'getUserMasterListReport')
    .mockImplementation(async (body) => ({
      Result: {
        Data: [
          { UserMasterID: body.PageNumber, UserName: `user-${body.PageNumber}`, ParentId: null },
        ],
        TotalRecords: 25,
        PageNumber: body.PageNumber,
        PageSize: body.PageSize,
        TotalPages: 2,
      },
    }));
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <UserListReportComponent />
    </QueryClientProvider>,
  );
  return report;
}

it('pages through users and applies typed filters, sorting and page size on Search', async () => {
  const report = setup();
  await screen.findByText('user-1');
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByText('user-2');
  expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText('Page 2 of 2')).toBeDefined();
  await screen.findByRole('option', { name: 'Retailer' });
  for (const [label, value] of [
    ['Search text', ' alex '],
    ['User type', '5'],
    ['Parent ID', '10'],
    ['Status ID', '8'],
    ['Page size', '50'],
    ['Sort by', 'UserName'],
    ['Sort direction', 'ASC'],
  ]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  expect(report).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await waitFor(() =>
    expect(report).toHaveBeenLastCalledWith(
      expect.objectContaining({
        FreeTextSearch: 'alex',
        UserTypeId: 5,
        ParentId: 10,
        Status: 8,
        PageNumber: 1,
        PageSize: 50,
        SortColumn: 'UserName',
        SortDirection: 'ASC',
      }),
      expect.any(AbortSignal),
    ),
  );
  await screen.findByText('user-1');
});

it('renders an empty Data report and disables pagination and export', async () => {
  const report = setup();
  await screen.findByText('user-1');
  report.mockResolvedValueOnce({
    Result: {
      Data: [],
      TotalRecords: 0,
      PageNumber: 1,
      PageSize: 20,
      TotalPages: 0,
    },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await screen.findByText('No users found for the selected filters.');
  for (const name of ['Previous', 'Next', 'Export current page']) {
    expect((screen.getByRole('button', { name }) as HTMLButtonElement).disabled).toBe(true);
  }
});

it('shows a retryable error for an unexpected report response', async () => {
  const report = setup();
  await screen.findByText('user-1');
  report.mockResolvedValueOnce({ Result: [] });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByText('The server returned an unexpected user list report.');
  expect(screen.queryByText('user-1')).toBeNull();
});
