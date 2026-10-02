import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserMgrService } from '../../services/UserMgrservice';
import UserParentMapping from './UserParentMapping';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function setup(userTypeId: number, parentId = 0, userTypeName?: string, finish = vi.fn()) {
  vi.spyOn(UserMgrService, 'getUserMasterById').mockResolvedValue({
    Result: [{ UserMasterID: 40, ParentId: parentId }],
  });
  vi.spyOn(UserMgrService, 'getUserMastersByUserTypeId').mockImplementation(async (type) => ({
    Result:
      type === 3
        ? [
            {
              UserMasterID: 10,
              UserTypeId: 3,
              UserName: 'Master A',
              FirstName: 'Ajay',
              MiddleName: 'Kumar',
              LastName: 'Verma',
            },
            { UserMasterID: 11, UserTypeId: 3, UserName: 'Master B' },
          ]
        : [
            { UserMasterID: 25, UserTypeId: 4, ParentId: 10, UserName: 'Distributor A' },
            { UserMasterID: 26, UserTypeId: 4, ParentId: 11, UserName: 'Distributor B' },
            { UserMasterID: 27, UserTypeId: 5, ParentId: 10, UserName: 'Retailer' },
          ],
  }));
  vi.spyOn(UserMgrService, 'getUsersByParentId').mockImplementation(async (parent) => ({
    Result:
      parent === 10
        ? [{ UserMasterID: 25, UserName: 'Distributor A' }]
        : [{ UserMasterID: 26, UserName: 'Distributor B' }],
  }));
  const save = vi.spyOn(UserMgrService, 'mapUserParent').mockResolvedValue({ Result: {} });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <UserParentMapping
        userTypeName={userTypeName}
        userId={40}
        userTypeId={userTypeId}
        active
        onSaving={vi.fn()}
        onFinish={finish}
      />
    </QueryClientProvider>,
  );
  return save;
}
it('preselects and saves a Distributor master parent', async () => {
  const finish = vi.fn();
  const save = setup(4, 10, undefined, finish);
  const master = (await screen.findByLabelText('Master Distributor *')) as HTMLSelectElement;
  expect(master.value).toBe('10');
  expect(screen.getByRole('option', { name: 'Ajay Kumar Verma[Master A]' })).toBeDefined();
  expect(screen.queryByLabelText('Distributor *')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Save and finish' }));
  await screen.findByText('Parent mapping saved.');
  expect(save).toHaveBeenCalledWith({ userMasterID: 40, parentId: 10 });
  expect(finish).toHaveBeenCalledTimes(1);
});
it('filters Retailer distributors, clears stale choices, and saves the direct Distributor parent', async () => {
  const save = setup(5);
  const master = await screen.findByLabelText('Master Distributor *');
  expect((screen.getByLabelText('Distributor *') as HTMLSelectElement).disabled).toBe(true);
  expect(
    (screen.getByRole('button', { name: 'Save and finish' }) as HTMLButtonElement).disabled,
  ).toBe(true);
  fireEvent.change(master, { target: { value: '10' } });
  await screen.findByRole('option', { name: '[Distributor A]' });
  expect((screen.getByLabelText('Distributor *') as HTMLSelectElement).disabled).toBe(false);
  expect(screen.getByRole('option', { name: '[Distributor A]' })).toBeDefined();
  expect(screen.queryByRole('option', { name: '[Distributor B]' })).toBeNull();
  expect(screen.queryByRole('option', { name: '[Retailer]' })).toBeNull();
  fireEvent.change(screen.getByLabelText('Distributor *'), { target: { value: '25' } });
  fireEvent.change(master, { target: { value: '11' } });
  expect((screen.getByLabelText('Distributor *') as HTMLSelectElement).value).toBe('');
  expect(screen.queryByRole('option', { name: '[Distributor A]' })).toBeNull();
  expect(
    (screen.getByRole('button', { name: 'Save and finish' }) as HTMLButtonElement).disabled,
  ).toBe(true);
  await screen.findByRole('option', { name: '[Distributor B]' });
  expect(UserMgrService.getUsersByParentId).toHaveBeenCalledWith(11, 4, expect.any(AbortSignal));
  fireEvent.change(screen.getByLabelText('Distributor *'), { target: { value: '26' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save and finish' }));
  await waitFor(() => expect(save).toHaveBeenCalledWith({ userMasterID: 40, parentId: 26 }));
});
it('restores both levels of an existing Retailer mapping', async () => {
  setup(5, 25);
  expect(((await screen.findByLabelText('Master Distributor *')) as HTMLSelectElement).value).toBe(
    '10',
  );
  await screen.findByRole('option', { name: '[Distributor A]' });
  expect((screen.getByLabelText('Distributor *') as HTMLSelectElement).value).toBe('25');
});
it('shows both dropdowns for the Retailor type name even when its ID differs', async () => {
  setup(4, 0, 'Retailor');
  await screen.findByLabelText('Master Distributor *');
  expect((screen.getByLabelText('Distributor *') as HTMLSelectElement).disabled).toBe(true);
});
it('shows save failures and allows retry', async () => {
  const save = setup(4, 10);
  save.mockRejectedValueOnce(new Error('Mapping failed'));
  await screen.findByLabelText('Master Distributor *');
  fireEvent.click(screen.getByRole('button', { name: 'Save and finish' }));
  await screen.findByText('Mapping failed');
  fireEvent.click(screen.getByRole('button', { name: 'Save and finish' }));
  await screen.findByText('Parent mapping saved.');
});
