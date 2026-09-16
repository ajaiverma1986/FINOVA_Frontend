import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { request } from '../../core/api';
import ChargeDeductionTypePage from './ChargeDeductionTypePage';
import SlabTypePage from './SlabTypePage';
import CalculationTypePage from './CalculationTypePage';

vi.mock('../../core/api', () => ({ request: vi.fn().mockResolvedValue({ Result: [] }) }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it.each([
  [CalculationTypePage, '/Dashboard/CalculationType', 'CalculationType', 'CalculationTypes', 'Calculation type ID', 'Calculation type name', 'CalculationTypeId', 'CalculationTypeName'],
  [
    ChargeDeductionTypePage,
    '/Dashboard/chrgdedutype',
    'ChargeDeductionType',
    'ChargeDeductionTypes',
    'Charge deduction ID',
    'Charge deduction type',
    'ChargeDeductionId',
    'ChargeDeductionType',
  ],
  [
    SlabTypePage,
    '/Dashboard/slabtype',
    'SlabType',
    'SlabTypes',
    'Slab type ID',
    'Slab type name',
    'SlabTypId',
    'SlabTypeName',
  ],
] as const)(
  'loads and creates %s through MasterData',
  async (Page, path, entity, plural, idLabel, nameLabel, idKey, nameKey) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    function mount(route: string) {
      render(
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={[route]}>
            <Page />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    }
    mount(path);
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(`/MasterData/GetAll${plural}`, expect.any(Object)),
    );
    fireEvent.click(await screen.findByLabelText('Active only'));
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(`/MasterData/GetActive${plural}`, expect.any(Object)),
    );
    cleanup();
    mount(path + '/Create');
    fireEvent.change(await screen.findByLabelText(idLabel), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(nameLabel), { target: { value: 'Example' } });
    fireEvent.click(screen.getByRole('button', { name: /Create / }));
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(`/MasterData/Create${entity}`, {
        method: 'POST',
        body: { [idKey]: 5, [nameKey]: 'Example', Status: 1 },
      }),
    );
  },
);
