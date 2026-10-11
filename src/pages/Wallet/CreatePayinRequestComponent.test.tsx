import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { request } from '../../core/api';
import CreatePayinRequestComponent from './CreatePayinRequestComponent';

vi.mock('../../core/api', () => ({ request: vi.fn() }));
vi.mock('../../core/auth', () => ({ useAuth: () => ({ session: { username: 'current.user' } }) }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
function mount(userId: number | null = 42, failCreate = false) {
  let created = false;
  vi.mocked(request).mockImplementation(async (path) => {
    if (path.startsWith('/User/GetUserMasterDetailsforConfig'))
      return { Result: { UserMasterID: userId } };
    if (path === '/Wallet/GetActiveCompanyAccounts')
      return {
        Result: {
          Items: [
            {
              CompanyAccountID: 8,
              AccountName: 'Company bank',
              AccountNo: '1234',
              Ifsccode: 'BANK0001234',
              FileUrl: '/files/company.pdf',
            },
            { CompanyAccountID: 9, AccountName: 'Second company bank' },
          ],
        },
      };
    if (path === '/UserMgr/GetActiveUserBankAccountsByUserMasterID?userMasterID=42')
      return { Result: [{ OriginatorAccountID: 12, AccountName: 'My bank', AccountNo: '5678' }] };
    if (path === '/MasterData/GetActivePaymentChanels')
      return { Result: [{ PaymentChanelID: 2, PaymentChanelName: 'Bank transfer' }] };
    if (path === '/MasterData/GetActivePaymentModes')
      return { Result: [{ PaymentModeID: 3, PaymentChanelID: 2, PaymentModeName: 'NEFT' }] };
    if (path === '/Wallet/CreatePayinRequest') {
      if (failCreate) throw new Error('Unable to create request');
      created = true;
      return { Result: { RequestID: 9 } };
    }
    if (path === '/Wallet/GetPayinRequestsByUserMasterID?userMasterId=42')
      return {
        Result: [
          {
            RequestID: 9,
            Status: 1,
            Remarks: created ? 'New request visible' : 'Existing request',
          },
        ],
      };
    return { Result: [] };
  });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <CreatePayinRequestComponent />
    </QueryClientProvider>,
  );
}
async function fill() {
  await screen.findByText('Existing request');
  await screen.findByRole('option', { name: 'Bank transfer' });
  fireEvent.change(screen.getByLabelText('Payment channel'), { target: { value: '2' } });
  await screen.findByRole('option', { name: 'NEFT' });
  fireEvent.change(screen.getByLabelText('Payment mode'), { target: { value: '3' } });
  fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '125.50' } });
}
it('creates a pending request for the logged-in user and refreshes their grid', async () => {
  mount();
  await fill();
  fireEvent.click(screen.getByRole('button', { name: 'Create request' }));
  await screen.findByText('New request visible');
  const body = vi
    .mocked(request)
    .mock.calls.find(([path]) => path === '/Wallet/CreatePayinRequest')?.[1]?.body as FormData;
  expect(Object.fromEntries(body.entries())).toMatchObject({
    UserMasterId: '42',
    Status: '1',
    PaymentChanelID: '2',
    PaymentModeId: '3',
    Amount: '125.5',
    Charge: '0',
  });
  expect(body.has('File')).toBe(false);
  expect(
    vi.mocked(request).mock.calls.some(([path]) => path === '/Wallet/GetAllPayinRequests'),
  ).toBe(false);
  expect((screen.getByLabelText('Amount') as HTMLInputElement).value).toBe('');
});
it('does not load wallet requests when the profile has no valid user ID', async () => {
  mount(null);
  await screen.findByText('Your profile does not contain a valid user ID.');
  expect(vi.mocked(request).mock.calls.some(([path]) => path.startsWith('/Wallet/'))).toBe(false);
});
it('preserves the form when submission fails', async () => {
  mount(42, true);
  await fill();
  fireEvent.click(screen.getByRole('button', { name: 'Create request' }));
  await screen.findByText('Unable to create request');
  await waitFor(() =>
    expect((screen.getByLabelText('Amount') as HTMLInputElement).value).toBe('125.50'),
  );
  expect(screen.queryByText('Pay-in request created.')).toBeNull();
});

it('includes the optional receipt in the multipart create request', async () => {
  mount();
  await fill();
  const file = new File(['receipt'], 'receipt.pdf', { type: 'application/pdf' });
  const picker = screen.getByLabelText('Receipt (optional)') as HTMLInputElement;
  expect(picker.required).toBe(false);
  fireEvent.change(picker, { target: { files: [file] } });
  fireEvent.click(screen.getByRole('button', { name: 'Create request' }));
  await screen.findByText('Pay-in request created.');
  const creates = vi
    .mocked(request)
    .mock.calls.filter(([path]) => path === '/Wallet/CreatePayinRequest');
  expect(creates).toHaveLength(1);
  expect((creates[0][1]?.body as FormData).get('File')).toBe(file);
  expect(vi.mocked(request).mock.calls.some(([path]) => path.startsWith('/Transaction/'))).toBe(
    false,
  );
});

it('loads active company and user accounts and submits selected IDs', async () => {
  mount();
  await fill();
  await screen.findByRole('option', { name: /Company bank.*1234/ });
  await screen.findByRole('option', { name: 'Second company bank' });
  await screen.findByRole('option', { name: /My bank.*5678/ });
  fireEvent.change(screen.getByLabelText('Company account'), { target: { value: '8' } });
  fireEvent.change(screen.getByLabelText('Originator account'), { target: { value: '12' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create request' }));
  await screen.findByText('Pay-in request created.');
  const body = vi
    .mocked(request)
    .mock.calls.find(([path]) => path === '/Wallet/CreatePayinRequest')?.[1]?.body as FormData;
  expect(Object.fromEntries(body.entries())).toMatchObject({
    BenficiaryAccountId: '8',
    OriginatorAccountId: '12',
    UserMasterId: '42',
  });
});

it('opens company accounts and shows documents only for accounts with files', async () => {
  mount();
  await fill();
  fireEvent.click(screen.getByRole('button', { name: 'View company accounts' }));
  const dialog = within(await screen.findByRole('dialog', { name: 'Company accounts' }));
  expect(dialog.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
    'Account name',
    'Account number',
    'IFSC code',
    'Document',
  ]);
  expect(dialog.getByText('BANK0001234')).toBeTruthy();
  expect(dialog.getAllByRole('button', { name: 'View document' })).toHaveLength(1);
  fireEvent.click(dialog.getByRole('button', { name: 'View document' }));
  await screen.findByRole('dialog', { name: 'Company bank document' });
  expect(screen.getByTitle('Company bank document').getAttribute('src')).toContain(
    '/files/company.pdf',
  );
});
