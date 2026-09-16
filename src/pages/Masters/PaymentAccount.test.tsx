import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { request } from '../../core/api';
import PaymentAccountPage from './PaymentAccountPage';

vi.mock('../../core/api', () => ({ request: vi.fn().mockResolvedValue({ Result: [] }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function mount(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><PaymentAccountPage /></MemoryRouter></QueryClientProvider>);
}
it('loads all and active payment accounts from MasterData', async () => {
  mount('/Dashboard/payacclist');
  await waitFor(() => expect(request).toHaveBeenCalledWith('/MasterData/GetAllPaymentAccounts', expect.any(Object)));
  fireEvent.click(await screen.findByLabelText('Active only'));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/MasterData/GetActivePaymentAccounts', expect.any(Object)));
});
it('creates an account with numeric status, selected active bank and preserved account number', async () => {
  vi.mocked(request).mockResolvedValueOnce({ Result: [{ BankID: 5, BankName: 'Example Bank' }] });
  mount('/Dashboard/payacclist/Create');
  await screen.findByRole('option', { name: 'Example Bank' });
  fireEvent.change(screen.getByLabelText('Bank'), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText('Account name'), { target: { value: 'Example' } });
  fireEvent.change(screen.getByLabelText('Account number'), { target: { value: '00123456' } });
  fireEvent.change(screen.getByLabelText('IFSC code'), { target: { value: 'TEST0001234' } });
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create payment account' }));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/MasterData/CreatePaymentAccount', {
    method: 'POST', body: { BankID: 5, AccountName: 'Example', AccountNo: '00123456', Ifsccode: 'TEST0001234', BranchName: '', Branchcode: '', Micrcode: '', BranchAddress: '', Status: 0, Remarks: '' },
  }));
});
