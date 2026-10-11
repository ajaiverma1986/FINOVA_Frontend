import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserMgrService } from '../../services/UserMgrservice';
import { exportToExcel } from '../../core/exportToExcel';
import ThresoldUserListComponent from './ThresoldUserListComponent';

vi.mock('../../core/exportToExcel', () => ({ exportToExcel: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function setup() {
  const getList = vi.spyOn(UserMgrService, 'getThresoldUserList').mockResolvedValue({
    Result: [
      {
        UserMasterId: 21,
        UserName: 'alex',
        FirstName: 'Alex',
        LastName: 'Verma',
        OrganizationName: 'Finova',
        UserTypeName: 'Retailor',
        MobileNo: '9999999999',
        EmailId: 'alex@example.com',
        AvailableLimit: 50000,
        ThresoldLimit: 10000,
        Status: 1,
      },
    ],
  });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <ThresoldUserListComponent />
    </QueryClientProvider>,
  );
  return getList;
}

it('loads and displays the threshold user list', async () => {
  const getList = setup();
  const table = await screen.findByRole('table', { name: 'User band limits' });

  expect(getList).toHaveBeenCalledWith(
    {
      OrganizationID: 0,
      UserTypeId: 0,
      ParentId: 0,
      Status: 0,
      SearchText: '',
    },
    expect.any(AbortSignal),
  );
  expect(within(table).getByText('Alex')).toBeDefined();
  expect(within(table).getByText('₹50,000.00')).toBeDefined();
  expect(within(table).getByText('₹10,000.00')).toBeDefined();
});

it('submits the selected user band limit and refreshes the list', async () => {
  setup();
  const update = vi.spyOn(UserMgrService, 'updateUserWalletThresoldLimit').mockResolvedValue({});
  fireEvent.click(await screen.findByRole('button', { name: 'Set Band Limit' }));
  const dialog = screen.getByRole('dialog', { name: 'Set Band Limit' });
  expect(within(dialog).getByText('User Type: Retailor')).toBeDefined();
  fireEvent.change(within(dialog).getByLabelText('Band limit'), { target: { value: '15000' } });
  fireEvent.change(within(dialog).getByLabelText('Reason'), {
    target: { value: 'Risk review' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save Band Limit' }));

  await waitFor(() =>
    expect(update).toHaveBeenCalledWith({
      UserMasterId: 21,
      ThresoldLimit: 15000,
      ThresoldReason: 'Risk review',
    }),
  );
  await screen.findByRole('status');
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('exports the current user rows to Excel', async () => {
  setup();
  await screen.findByText('alex');
  fireEvent.click(await screen.findByRole('button', { name: 'Export to Excel' }));

  expect(exportToExcel).toHaveBeenCalledWith(
    'User Band Limits',
    expect.arrayContaining(['User ID', 'User Name', 'Band Limit']),
    [
      expect.objectContaining({
        'User ID': 21,
        'User Name': 'alex',
        'Available Limit': '₹50,000.00',
        'Band Limit': '₹10,000.00',
      }),
    ],
  );
});
