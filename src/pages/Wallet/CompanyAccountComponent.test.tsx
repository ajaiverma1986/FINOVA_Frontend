import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { request } from '../../core/api';
import { OrgMgrService } from '../../services/OrgMgrService';
import { AppMgrService } from '../../services/AppMgrService';
import { MasterDataService } from '../../services/MasterDataService';
import CompanyAccountComponent from './CompanyAccountComponent';

vi.mock('../../core/api', () => ({ request: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});
function mount(fileUrl = '') {
  vi.spyOn(OrgMgrService, 'getActiveOrganizations').mockResolvedValue({
    Result: [{ OrganizationID: 2, OrganizationName: 'Example Company' }],
  });
  vi.spyOn(AppMgrService, 'getActiveApplications').mockResolvedValue({
    Result: [{ ApplicationID: 3, ApplicationName: 'Example App' }],
  });
  vi.spyOn(MasterDataService, 'getActiveBanks').mockResolvedValue({
    Result: [{ BankID: 4, BankName: 'Example Bank' }],
  });
  vi.mocked(request).mockResolvedValue({
    Result: [
      {
        CompanyAccountId: 7,
        OrganizationId: 2,
        ApplicationId: 3,
        BankId: 4,
        AccountName: 'Operating account',
        AccountNo: '001234',
        FileUrl: fileUrl,
        BranchName: 'Main branch',
        BranchCode: '001',
        BranchAddress: 'Main street',
        Status: 1,
      },
    ],
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(
    <QueryClientProvider client={client}>
      <CompanyAccountComponent />
    </QueryClientProvider>,
  );
}
it('creates with a multipart attachment and preserves account number text', async () => {
  mount();
  await screen.findByText('Operating account');
  fireEvent.click(screen.getByRole('button', { name: 'Create company account' }));
  const dialog = within(await screen.findByRole('dialog'));
  await dialog.findByRole('option', { name: 'Example Company' });
  await dialog.findByRole('option', { name: 'Example App' });
  await dialog.findByRole('option', { name: 'Example Bank' });
  for (const [name, id] of [
    ['Company name', '2'],
    ['Application name', '3'],
    ['Bank name', '4'],
  ]) {
    fireEvent.change(dialog.getByLabelText(name), { target: { value: id } });
  }
  fireEvent.change(dialog.getByLabelText('Account Type'), { target: { value: '2' } });
  fireEvent.change(dialog.getByLabelText('Account No'), { target: { value: '001234' } });
  const file = new File(['receipt'], 'account.pdf', { type: 'application/pdf' });
  fireEvent.change(dialog.getByLabelText('Attachment'), { target: { files: [file] } });
  // jsdom does not transfer a synthetic FileList into FormData automatically.
  const originalGet = FormData.prototype.get;
  vi.spyOn(FormData.prototype, 'get').mockImplementation(function (this: FormData, key: string) {
    return key === 'File' ? file : originalGet.call(this, key);
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  const call = vi
    .mocked(request)
    .mock.calls.find(([path]) => path === '/Wallet/CreateCompanyAccount');
  const body = call?.[1]?.body as FormData;
  expect(body.get('AccountNo')).toBe('001234');
  expect(body.get('OrganizationId')).toBe('2');
  expect(body.get('ApplicationId')).toBe('3');
  expect(body.get('BankId')).toBe('4');
  expect(body.get('AccountType')).toBe('2');
  expect(body.get('CompanyAccountId')).toBeNull();
  expect(body.getAll('File')).toEqual([file]);
  vi.restoreAllMocks();
});
it('loads details, edits, and filters using wallet endpoints', async () => {
  mount();
  await screen.findByText('Operating account');
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  const dialog = within(await screen.findByRole('dialog'));
  await waitFor(() =>
    expect((dialog.getByLabelText('Account No') as HTMLInputElement).value).toBe('001234'),
  );
  fireEvent.change(dialog.getByLabelText('Account Name'), { target: { value: 'Updated account' } });
  fireEvent.click(dialog.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  const body = vi
    .mocked(request)
    .mock.calls.find(([path]) => path === '/Wallet/UpdateCompanyAccount')?.[1]?.body as FormData;
  expect(body.get('CompanyAccountId')).toBe('7');
  expect(body.get('AccountName')).toBe('Updated account');
  expect(body.has('File')).toBe(false);
  fireEvent.change(screen.getByLabelText('Search by'), {
    target: { value: 'organizationApplication' },
  });
  await screen.findByRole('option', { name: 'Example App' });
  fireEvent.change(screen.getByLabelText('Company name'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Application name'), { target: { value: '3' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith(
      '/Wallet/GetCompanyAccountsByOrganizationApplication?organizationId=2&applicationId=3',
      expect.objectContaining({ method: 'GET' }),
    ),
  );
  expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
});

it.each(['', '/uploads/account.pdf'])('shows documents only when available (%s)', async (fileUrl) => {
  mount(fileUrl);
  await screen.findByText('Operating account');
  for (const name of ['Organization Id', 'Application Id', 'Bank Id', 'Branch Name', 'Branch Code', 'Branch Address', 'File Url', 'Status']) {
    expect(screen.queryByRole('columnheader', { name })).toBeNull();
  }
  const button = screen.queryByRole('button', { name: 'View document' });
  if (fileUrl) {
    expect(button).not.toBeNull();
    fireEvent.click(button!);
    await screen.findByRole('dialog', { name: 'Company account 7 document' });
    expect(screen.getByTitle('Company account 7 document').getAttribute('src')).toContain(fileUrl);
  } else {
    expect(button).toBeNull();
  }
});
