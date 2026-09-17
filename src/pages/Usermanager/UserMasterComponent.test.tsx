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
  vi.spyOn(MasterDataService, 'getActiveChargeDeductionTypes').mockResolvedValue({
    Result: [{ ChargeDeductionId: 2, ChargeDeductionType: 'On transaction' }],
  });
  vi.spyOn(MasterDataService, 'getActivePlans').mockResolvedValue({
    Result: [{ PlanID: 4, PlanName: 'Standard plan' }],
  });
  vi.spyOn(MasterDataService, 'getActiveCompanyTypes').mockResolvedValue({
    Result: [{ CompnayTypeId: 2, CompanyTypeName: 'Private company' }],
  });
  vi.spyOn(MasterDataService, 'getKycTypesByUserTypeId').mockResolvedValue({
    Result: [{ KycTypeID: 3, KycTypeName: 'PAN', CompanyTypeId: 2 }],
  });
  vi.spyOn(MasterDataService, 'demographicDataListByPincode').mockResolvedValue({
    Result: [
      { PincodeDataId: 5, AreaName: 'Central', DistrictName: 'Bengaluru', StateName: 'Karnataka' },
    ],
  });
  vi.spyOn(UserMgrService, 'getUserMasterByUserName').mockResolvedValue({ Result: [] });
  vi.spyOn(UserMgrService, 'getUserAddressesByUserMasterId').mockResolvedValue({ Result: [] });
  vi.spyOn(MasterDataService, 'getActiveAddressTypes').mockResolvedValue({
    Result: [{ AddressTypeId: 2, AddressTypeName: 'Home' }],
  });
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
  const create = vi
    .spyOn(UserMgrService, 'createUserMaster')
    .mockResolvedValue({ Result: { UserMasterID: 9 } });
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
    fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
    await within(dialog).findByLabelText('Address type');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
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
  fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
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

it('keeps address drafts on Previous and updates the saved user on Next', async () => {
  setup();
  const update = vi.spyOn(UserMgrService, 'updateUserMaster').mockResolvedValue({ Result: {} });
  fireEvent.click(await screen.findByRole('button', { name: 'Edit user' }));
  const dialog = await screen.findByRole('dialog', { name: 'Update user' });
  await within(dialog).findByLabelText('First Name');
  await within(dialog).findByRole('option', { name: 'Example Org' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
  fireEvent.change(await within(dialog).findByLabelText('Address line 1'), {
    target: { value: 'Draft address' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Previous' }));
  expect((within(dialog).getByLabelText('First Name') as HTMLInputElement).value).toBe('Alex');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
  expect(((await within(dialog).findByLabelText('Address line 1')) as HTMLInputElement).value).toBe(
    'Draft address',
  );
  expect(update).toHaveBeenCalledTimes(2);
});

it('loads an existing username instead of creating a duplicate', async () => {
  setup();
  vi.mocked(UserMgrService.getUserMasterByUserName).mockResolvedValue({
    Result: [{ UserMasterID: 7, UserName: 'alex' }],
  });
  const create = vi.spyOn(UserMgrService, 'createUserMaster');
  const update = vi.spyOn(UserMgrService, 'updateUserMaster').mockResolvedValue({ Result: {} });
  fireEvent.click(await screen.findByRole('button', { name: 'Create user' }));
  const dialog = await screen.findByRole('dialog', { name: 'Create user' });
  await within(dialog).findByRole('option', { name: 'Example Org' });
  fireEvent.change(within(dialog).getByLabelText('Organization'), { target: { value: '4' } });
  fireEvent.change(within(dialog).getByLabelText('Gender'), { target: { value: '1' } });
  fireEvent.change(within(dialog).getByLabelText('User Name'), { target: { value: 'alex' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
  await within(dialog).findByText(/This user already exists/);
  expect((within(dialog).getByLabelText('First Name') as HTMLInputElement).value).toBe('Alex');
  expect(within(dialog).queryByLabelText('Password')).toBeNull();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
  await within(dialog).findByLabelText('Address type');
  expect(create).not.toHaveBeenCalled();
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ UserMasterID: 7 }));
});

it('completes all steps with the same user ID and finishes the dialog', async () => {
  setup();
  vi.spyOn(UserMgrService, 'updateUserMaster').mockResolvedValue({ Result: {} });
  vi.spyOn(UserMgrService, 'getUserKycByUserMasterId').mockResolvedValue({ Result: [] });
  vi.spyOn(UserMgrService, 'getUserBankAccountsByUserMasterId').mockResolvedValue({ Result: [] });
  vi.spyOn(UserMgrService, 'getUserConfigurationByUserMasterId').mockResolvedValue({ Result: [] });
  vi.spyOn(UserMgrService, 'getOtherDetailsByUserMasterId').mockResolvedValue({ Result: [] });
  vi.spyOn(MasterDataService, 'getActiveKycTypes').mockResolvedValue({
    Result: [{ KycTypeID: 3, KycTypeName: 'PAN' }],
  });
  vi.spyOn(MasterDataService, 'getActiveBanks').mockResolvedValue({
    Result: [{ BankID: 4, BankName: 'Example Bank' }],
  });
  const address = vi
    .spyOn(UserMgrService, 'createUserAddress')
    .mockResolvedValue({ Result: { UserAddressID: 10 } });
  const kyc = vi
    .spyOn(UserMgrService, 'createUserKyc')
    .mockResolvedValue({ Result: { UserKYCID: 11 } });
  const bank = vi
    .spyOn(UserMgrService, 'createUserBankAccount')
    .mockResolvedValue({ Result: { OriginatorAccountID: 12 } });
  const config = vi
    .spyOn(UserMgrService, 'createUserConfiguration')
    .mockResolvedValue({ Result: { ConfigurationId: 13 } });
  const other = vi
    .spyOn(UserMgrService, 'createOtherDetails')
    .mockResolvedValue({ Result: { OtherDetailId: 14 } });
  fireEvent.click(await screen.findByRole('button', { name: 'Edit user' }));
  const dialog = await screen.findByRole('dialog', { name: 'Update user' });
  await within(dialog).findByLabelText('First Name');
  await within(dialog).findByRole('option', { name: 'Example Org' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
  const change = (label: string, value: string) =>
    fireEvent.change(within(dialog).getByLabelText(label), { target: { value } });
  await within(dialog).findByRole('option', { name: 'Home' });
  change('Address type', '2');
  change('Pincode', '560001');
  await within(dialog).findByRole('option', { name: 'Central, Bengaluru, Karnataka' });
  change('Pincode data ID', '5');
  change('Address line 1', 'Main Road');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
  await within(dialog).findByRole('option', { name: 'PAN' });
  await within(dialog).findByRole('option', { name: 'Private company' });
  change('Company type', '2');
  await waitFor(() =>
    expect((within(dialog).getByLabelText('KYC document') as HTMLSelectElement).disabled).toBe(
      false,
    ),
  );
  change('KYC document', '3');
  change('Document number', 'ABCDE1234F');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
  await within(dialog).findByRole('option', { name: 'Example Bank' });
  change('Bank', '4');
  change('Account name', 'Alex');
  change('Account number', '001234');
  change('IFSC code', 'ABCD0000001');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
  await within(dialog).findByLabelText('Minimum transaction');
  await within(dialog).findByRole('option', { name: 'Standard plan' });
  change('Charge type', '2');
  change('Plan', '4');
  change('Same amount pay-in allowed', '2');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
  await within(dialog).findByLabelText('PAN card');
  change('PAN card', 'ABCDE1234F');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save and finish' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  for (const save of [address, kyc, config, other])
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ UserMasterId: 7 }));
  expect(bank).toHaveBeenCalledWith(
    expect.objectContaining({ UserMasterID: 7, BankId: 4, AccountNo: '001234' }),
  );
  expect(kyc).toHaveBeenCalledWith(expect.objectContaining({ KycID: 3 }));
  expect(config).toHaveBeenCalledWith(
    expect.objectContaining({ ChargeTypeOn: 2, PlanId: 4, SameAmountPayinAllowed: 2 }),
  );
});

it('switches interactive tabs with the mouse and keyboard while preserving drafts', async () => {
  setup();
  vi.spyOn(UserMgrService, 'getUserKycByUserMasterId').mockResolvedValue({ Result: [] });
  vi.spyOn(MasterDataService, 'getActiveKycTypes').mockResolvedValue({
    Result: [{ KycTypeID: 3, KycTypeName: 'PAN' }],
  });
  const update = vi.spyOn(UserMgrService, 'updateUserMaster');
  fireEvent.click(await screen.findByRole('button', { name: 'Edit user' }));
  const dialog = await screen.findByRole('dialog', { name: 'Update user' });
  await within(dialog).findByLabelText('First Name');
  fireEvent.click(within(dialog).getByRole('tab', { name: 'Address' }));
  fireEvent.change(await within(dialog).findByLabelText('Address line 1'), {
    target: { value: 'Unsaved address' },
  });
  fireEvent.keyDown(within(dialog).getByRole('tab', { name: 'Address' }), { key: 'ArrowRight' });
  await within(dialog).findByLabelText('Document number');
  expect(within(dialog).getByRole('tab', { name: 'KYC' }).getAttribute('aria-selected')).toBe(
    'true',
  );
  expect(within(dialog).getByRole('tabpanel', { name: 'KYC' })).toBeDefined();
  fireEvent.keyDown(within(dialog).getByRole('tab', { name: 'KYC' }), { key: 'Home' });
  expect(within(dialog).getByRole('tab', { name: 'User' }).getAttribute('aria-selected')).toBe(
    'true',
  );
  fireEvent.click(within(dialog).getByRole('tab', { name: 'Address' }));
  expect((within(dialog).getByLabelText('Address line 1') as HTMLInputElement).value).toBe(
    'Unsaved address',
  );
  expect(update).not.toHaveBeenCalled();
});

it('locks detail tabs until a new user has been saved', async () => {
  setup();
  fireEvent.click(await screen.findByRole('button', { name: 'Create user' }));
  const dialog = await screen.findByRole('dialog', { name: 'Create user' });
  for (const name of ['Address', 'KYC', 'Bank account', 'Configuration', 'Other details']) {
    expect((within(dialog).getByRole('tab', { name }) as HTMLButtonElement).disabled).toBe(true);
  }
  expect((within(dialog).getByRole('tab', { name: 'User' }) as HTMLButtonElement).disabled).toBe(
    false,
  );
});

it('loads pincode areas and clears the selected area when the pincode changes', async () => {
  setup();
  fireEvent.click(await screen.findByRole('button', { name: 'Edit user' }));
  const dialog = await screen.findByRole('dialog', { name: 'Update user' });
  await within(dialog).findByLabelText('First Name');
  fireEvent.click(within(dialog).getByRole('tab', { name: 'Address' }));
  const pincode = await within(dialog).findByLabelText('Pincode');
  fireEvent.change(pincode, { target: { value: '560001' } });
  await within(dialog).findByRole('option', { name: 'Central, Bengaluru, Karnataka' });
  expect(MasterDataService.demographicDataListByPincode).toHaveBeenCalledWith(
    '560001',
    expect.any(AbortSignal),
  );
  const select = within(dialog).getByLabelText('Pincode data ID') as HTMLSelectElement;
  fireEvent.change(select, { target: { value: '5' } });
  expect(select.value).toBe('5');
  vi.mocked(MasterDataService.demographicDataListByPincode).mockResolvedValue({ Result: [] });
  fireEvent.change(pincode, { target: { value: '560002' } });
  expect(select.value).toBe('');
  await within(dialog).findByRole('option', { name: 'No areas found for this pincode' });
  expect(
    within(dialog).queryByRole('option', { name: 'Central, Bengaluru, Karnataka' }),
  ).toBeNull();
});

it('filters KYC by company and clears the previous document selection', async () => {
  setup();
  vi.spyOn(UserMgrService, 'getUserKycByUserMasterId').mockResolvedValue({ Result: [] });
  vi.spyOn(MasterDataService, 'getActiveKycTypes').mockResolvedValue({ Result: [] });
  vi.mocked(MasterDataService.getActiveCompanyTypes).mockResolvedValue({
    Result: [
      { CompnayTypeId: 2, CompanyTypeName: 'Private company' },
      { CompnayTypeId: 4, CompanyTypeName: 'Partnership' },
    ],
  });
  vi.mocked(MasterDataService.getKycTypesByUserTypeId).mockImplementation(
    async (_user, company) => ({
      Result:
        company === 2
          ? [{ KycTypeID: 3, KycTypeName: 'Company PAN' }]
          : [{ KycTypeID: 8, KycTypeName: 'Partnership deed' }],
    }),
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Edit user' }));
  const dialog = await screen.findByRole('dialog', { name: 'Update user' });
  await within(dialog).findByLabelText('First Name');
  fireEvent.click(within(dialog).getByRole('tab', { name: 'KYC' }));
  await within(dialog).findByRole('option', { name: 'Private company' });
  const company = within(dialog).getByLabelText('Company type');
  const document = within(dialog).getByLabelText('KYC document') as HTMLSelectElement;
  expect(document.disabled).toBe(true);
  fireEvent.change(company, { target: { value: '2' } });
  await within(dialog).findByRole('option', { name: 'Company PAN' });
  expect(MasterDataService.getKycTypesByUserTypeId).toHaveBeenCalledWith(
    3,
    2,
    expect.any(AbortSignal),
  );
  fireEvent.change(document, { target: { value: '3' } });
  fireEvent.change(company, { target: { value: '4' } });
  expect(document.value).toBe('');
  await within(dialog).findByRole('option', { name: 'Partnership deed' });
  expect(within(dialog).queryByRole('option', { name: 'Company PAN' })).toBeNull();
  expect(MasterDataService.getKycTypesByUserTypeId).toHaveBeenCalledWith(
    3,
    4,
    expect.any(AbortSignal),
  );
});
