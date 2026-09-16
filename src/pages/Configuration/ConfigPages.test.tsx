import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { request } from '../../core/api';
import ConfigCrudComponent from './ConfigCrudComponent';
import ConfigActionComponent from './ConfigActionComponent';
import { configResources, configOperations } from './configResources';
import { title } from '../../components/DataTable';
import { MasterDataService } from '../../services/MasterDataService';
import { configLookupKind } from './ConfigLookup';

vi.mock('../../core/api', () => ({ request: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
function mount(node: React.ReactNode) {
  for (const method of [
    'getActivePlans',
    'getActiveAgencies',
    'getAllServices',
    'getActiveSlabTypes',
    'getActiveCalculationTypes',
  ] as const) {
    vi.spyOn(MasterDataService, method).mockResolvedValue({
      Result: [
        {
          PlanID: 2,
          PlanName: 'Example plan',
          AgencyId: 2,
          AgencyName: 'Example agency',
          ServiceId: 2,
          ServiceName: 'Example service',
          SlabTypId: 2,
          SlabTypeName: 'Example slab',
          CalculationTypeId: 2,
          CalculationTypeName: 'Example calculation',
        },
      ],
    });
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}
it.each(['topup', 'commission', 'transaction'])(
  'lists, views, creates and deletes %s records',
  async (key) => {
    const resource = configResources[key];
    vi.mocked(request).mockResolvedValue({
      Result: [{ [resource.id]: 7, Status: 1, Description: 'Existing record' }],
    });
    mount(<ConfigCrudComponent resourceKey={key} />);
    await screen.findByText('Existing record');
    expect(request).toHaveBeenCalledWith(
      `/Config/${resource.list}`,
      expect.objectContaining({ method: 'GET' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    const details = await screen.findByRole('dialog', { name: `View ${resource.singular}` });
    expect(await within(details).findByText('Existing record')).toBeDefined();
    fireEvent.click(within(details).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: `Create ${resource.singular}` }));
    const form = await screen.findByRole('dialog');
    for (const field of configOperations[resource.create].fields) {
      const kind = configLookupKind(field.key);
      if (kind) {
        await within(form).findByRole('option', { name: `Example ${kind}` });
        fireEvent.change(within(form).getByLabelText(kind === 'slab' ? 'Slab type' : kind === 'calculation' ? 'Calculation type' : title(kind)), {
          target: { value: '2' },
        });
      } else if (field.key !== 'Status' && !field.nullable)
        fireEvent.change(within(form).getByLabelText(title(field.key)), { target: { value: '2' } });
    }
    fireEvent.change(within(form).getByLabelText('Status'), { target: { value: '0' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        `/Config/${resource.create}`,
        expect.objectContaining({ method: 'POST', body: expect.objectContaining({ Status: 0 }) }),
      ),
    );
    const createCall = vi
      .mocked(request)
      .mock.calls.find(([path]) => path === `/Config/${resource.create}`)!;
    expect(createCall[1]?.body).not.toHaveProperty(resource.id);
    for (const field of configOperations[resource.create].fields) {
      if (configLookupKind(field.key)) expect(createCall[1]?.body).toHaveProperty(field.key, 2);
    }
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirm delete' }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        `/Config/${resource.remove}/7`,
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
  },
);
it.each(['GetServicePolicy', 'AddTransacttionSlab'] as const)(
  'submits %s only after the form is submitted',
  async (operation) => {
    vi.mocked(request).mockResolvedValue({ Result: { Message: 'Completed' } });
    mount(<ConfigActionComponent operation={operation} title="Configuration action" />);
    expect(request).not.toHaveBeenCalled();
    for (const field of configOperations[operation].fields) {
      const kind = configLookupKind(field.key);
      if (kind) await screen.findByRole('option', { name: `Example ${kind}` });
      fireEvent.change(
        screen.getByLabelText(
          kind ? (kind === 'slab' ? 'Slab type' : kind === 'calculation' ? 'Calculation type' : title(kind)) : title(field.key),
        ),
        {
          target: { value: field.type === 'string' ? 'example' : '2' },
        },
      );
    }
    fireEvent.click(
      screen.getByRole('button', {
        name: operation === 'GetServicePolicy' ? 'Get service policy' : 'Add transaction slab',
      }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        `/Config/${operation}`,
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  },
);
