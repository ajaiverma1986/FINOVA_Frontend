import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserMasterComponent from './UserMasterComponent';
import { UserMgrService } from '../../services/UserMgrservice';
import { MasterDataService } from '../../services/MasterDataService';
import { OrgMgrService } from '../../services/OrgMgrService';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function setup() {
  vi.spyOn(MasterDataService, 'getActiveUserTypes').mockResolvedValue({
    Result: [{ UserTypeId: 3, UserTypeName: 'API User' }],
  });
  vi.spyOn(MasterDataService, 'GenderList').mockResolvedValue({
    Result: [{ GenderID: 1, GenderName: 'Male' }],
  });
  vi.spyOn(OrgMgrService, 'getActiveOrganizations').mockResolvedValue({
    Result: [{ OrganizationID: 4, OrganizationName: 'Example Org' }],
  });
  vi.spyOn(UserMgrService, 'getAllUserMasters').mockResolvedValue({
    Result: [{ UserMasterID: 7, UserName: 'alex', Status: 1 }],
  });
  vi.spyOn(UserMgrService, 'getUserMasterById').mockResolvedValue({
    Result: [
      {
        UserMasterID: 7,
        UserName: 'alex',
        FirstName: 'Alex',
        UserTypeId: 3,
        OrganizationID: 4,
        GenderID: 1,
        Password: 'hidden-password',
        Status: 1,
      },
    ],
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(
    <QueryClientProvider client={client}>
      <UserMasterComponent />
    </QueryClientProvider>,
  );
}
it('opens details in a dismissible popup and hides passwords', async () => {
  setup();
  fireEvent.click(await screen.findByRole('button', { name: 'View user' }));
  const dialog = await screen.findByRole('dialog', { name: 'User details' });
  expect(await within(dialog).findByText('Alex')).toBeDefined();
  expect(within(dialog).queryByText('hidden-password')).toBeNull();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});
it('creates users without sending an ID and allows another create afterward', async () => {
  setup();
  const create = vi.spyOn(UserMgrService, 'createUserMaster').mockResolvedValue({ Result: {} });
  for (const name of ['first', 'second']) {
    fireEvent.click(await screen.findByRole('button', { name: 'Create user' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create user' });
    await within(dialog).findByRole('option', { name: 'Example Org' });
    fireEvent.change(within(dialog).getByLabelText('Organization'), { target: { value: '4' } });
    fireEvent.change(within(dialog).getByLabelText('Gender'), { target: { value: '1' } });
    fireEvent.change(within(dialog).getByLabelText('User type'), { target: { value: '3' } });
    fireEvent.change(within(dialog).getByLabelText('User Name'), { target: { value: name } });
    fireEvent.change(within(dialog).getByLabelText('Password'), {
      target: { value: 'test-password' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create user' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  }
  expect(create).toHaveBeenCalledTimes(2);
  expect(create.mock.calls[0][0]).not.toHaveProperty('UserMasterID');
  expect(create.mock.calls[0][0]).toMatchObject({
    IsPasswordExpired: false,
    IsLocked: false,
    LockedTill: null,
    UserId: 0,
    Status: 8,
  });
  expect(create.mock.calls[0][0]).toMatchObject({ OrganizationID: 4, GenderID: 1, UserTypeId: 3 });
});
it('updates only the fields accepted by the update endpoint', async () => {
  setup();
  const update = vi.spyOn(UserMgrService, 'updateUserMaster').mockResolvedValue({ Result: {} });
  fireEvent.click(await screen.findByRole('button', { name: 'Edit user' }));
  const dialog = await screen.findByRole('dialog', { name: 'Update user' });
  fireEvent.change(await within(dialog).findByLabelText('First Name'), {
    target: { value: 'Updated' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Update user' }));
  await waitFor(() => expect(update).toHaveBeenCalled());
  expect(update.mock.calls[0][0]).toMatchObject({ UserMasterID: 7, FirstName: 'Updated' });
  expect(update.mock.calls[0][0]).not.toHaveProperty('Password');
  expect(update.mock.calls[0][0]).not.toHaveProperty('IsLocked');
});
it('keeps the unlock action for the selected user', async () => {
  setup();
  const change = vi.spyOn(UserMgrService, 'unlockUserMaster').mockResolvedValue({ Result: {} });
  fireEvent.click(await screen.findByRole('button', { name: 'Unlock' }));
  const dialog = await screen.findByRole('dialog', { name: 'Unlock user' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Unlock user' }));
  await waitFor(() => expect(change).toHaveBeenCalledWith(7));
});
