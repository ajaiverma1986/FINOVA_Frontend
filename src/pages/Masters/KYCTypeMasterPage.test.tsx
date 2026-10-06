import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { request } from '../../core/api';
import { MasterDataService } from '../../services/MasterDataService';
import KYCTypeMasterPage from './KYCTypeMasterPage';

vi.mock('../../core/api', () => ({ request: vi.fn().mockResolvedValue({ Result: [] }) }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
function mount(path: string) {
  vi.spyOn(MasterDataService, 'getActiveUserTypes').mockResolvedValue({
    Result: [{ UserTypeId: 3, UserTypeName: 'API User' }],
  });
  vi.spyOn(MasterDataService, 'getActiveCompanyTypes').mockResolvedValue({
    Result: [{ CompnayTypeId: 2, CompanyTypeName: 'Private company' }],
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <KYCTypeMasterPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
it('loads type names and sends numeric IDs when creating KYC types', async () => {
  mount('/Dashboard/KycTypeMaster/Create');
  await screen.findByRole('option', { name: 'API User' });
  await screen.findByRole('option', { name: 'Private company' });
  expect(
    (screen.getByRole('button', { name: 'Create KYC type' }) as HTMLButtonElement).disabled,
  ).toBe(true);
  fireEvent.change(screen.getByLabelText('User type'), { target: { value: '3' } });
  fireEvent.change(screen.getByLabelText('Company type'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('KYC type name'), { target: { value: 'PAN' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create KYC type' }));
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith('/MasterData/CreateKycType', {
      method: 'POST',
      body: { UserTypeID: 3, CompanyTypeId: 2, KycTypeName: 'PAN', Status: 1 },
    }),
  );
});
it('preselects the saved user and company types during editing', async () => {
  vi.mocked(request).mockResolvedValueOnce({
    Result: [{ KycTypeID: 7, UserTypeID: 3, CompanyTypeId: 2, KycTypeName: 'PAN', Status: 1 }],
  });
  mount('/Dashboard/KycTypeMaster/Edit?id=7');
  await screen.findByRole('option', { name: 'Private company' });
  expect((screen.getByLabelText('User type') as HTMLSelectElement).value).toBe('3');
  expect((screen.getByLabelText('Company type') as HTMLSelectElement).value).toBe('2');
});
