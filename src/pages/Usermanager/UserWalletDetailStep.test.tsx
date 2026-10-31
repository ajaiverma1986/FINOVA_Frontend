import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserMgrService } from '../../services/UserMgrservice';
import UserWalletDetailStep from './UserWalletDetailStep';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('shows only wallet limit fields from the filtered wallet grid', async () => {
  const getWallets = vi.spyOn(UserMgrService, 'getUserWallets').mockResolvedValue({
    Result: [
      {
        UserDetailId: 18,
        UserMasterId: 40,
        AvailableLimit: 25000,
        ThresoldLimit: 5000,
        Status: 1,
      },
    ],
  });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <UserWalletDetailStep userId={40} active onPrevious={vi.fn()} onFinish={vi.fn()} />
    </QueryClientProvider>,
  );

  const table = await screen.findByRole('table', { name: 'Wallet Detail' });
  expect(getWallets).toHaveBeenCalledWith({ UserMasterId: 40, Status: 0 }, expect.any(AbortSignal));
  expect(table.querySelectorAll('th')).toHaveLength(2);
  expect(screen.getByRole('columnheader', { name: 'Available Limit' })).toBeDefined();
  expect(screen.getByRole('columnheader', { name: 'Threshold Limit' })).toBeDefined();
  expect(screen.getByText('25000')).toBeDefined();
  expect(screen.getByText('5000')).toBeDefined();
  expect(screen.queryByText('UserMasterId')).toBeNull();
});

it('does not load or render the grid before its tab is selected', () => {
  const getWallets = vi.spyOn(UserMgrService, 'getUserWallets');
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <UserWalletDetailStep userId={40} active={false} onPrevious={vi.fn()} onFinish={vi.fn()} />
    </QueryClientProvider>,
  );

  expect(getWallets).not.toHaveBeenCalled();
  expect(screen.queryByRole('table', { name: 'Wallet Detail' })).toBeNull();
});
