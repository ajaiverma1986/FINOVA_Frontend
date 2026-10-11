import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { request } from '../../core/api';
import ConfigCrudComponent from './ConfigCrudComponent';
import CommissionDistributionComponent from './CommissionDistributionComponent';
import ConfigActionComponent from './ConfigActionComponent';
import TdsConfiguration from './TdsConfiguration';
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
    'getAllAgencies',
    'getAllServices',
    'getAllSlabTypes',
    'getAllCalculationTypes',
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
it('filters code prefixes, loads an editor by ID, updates strings and searches active prefixes', async () => {
  vi.mocked(request).mockResolvedValue({ Result: [{ Id: 7, OrganizationId: 2, ApplicationId: 3, CodePrefix: 'FIN', CodeLngth: '08', Status: 1 }] });
  mount(<ConfigCrudComponent resourceKey="codePrefix" />);
  await screen.findByText('FIN');
  expect(request).toHaveBeenCalledWith('/Config/GetCodePrefixes', expect.objectContaining({
    method: 'POST', body: { Id: null, OrganizationId: null, ApplicationId: null, CodePrefix: null, Status: null },
  }));
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  expect((screen.getByLabelText('Status') as HTMLSelectElement).value).toBe('');
  fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
  const dialog = await screen.findByRole('dialog', { name: 'Edit code prefix' });
  await within(dialog).findByDisplayValue('FIN');
  expect(request).toHaveBeenCalledWith('/Config/GetCodePrefixes', expect.objectContaining({ body: { Id: 7, OrganizationId: null, ApplicationId: null, CodePrefix: null, Status: null } }));
  fireEvent.change(within(dialog).getByLabelText('Code Prefix'), { target: { value: 'NEW' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/Config/UpdateCodePrefix', expect.objectContaining({ method: 'POST', body: { Id: 7, OrganizationId: 2, ApplicationId: 3, CodePrefix: 'NEW', CodeLngth: '08', Status: 1 } })));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  fireEvent.change(screen.getByLabelText('Search by'), { target: { value: 'GetActiveCodePrefix' } });
  fireEvent.change(screen.getByLabelText('Organization Id'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Application Id'), { target: { value: '3' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/Config/GetActiveCodePrefix/2/3', expect.objectContaining({ method: 'GET' })));
});
it('lists and creates TDS rates using the documented request fields', async () => {
  vi.mocked(request).mockResolvedValue({
    Result: [
      {
        TdsRateId: 7,
        IsPanAvailable: true,
        TdsRate: 2.5,
        Remarks: 'Existing rate',
        Stratus: 1,
        StatusName: 'Active',
        CreatedOn: '2026-10-11T17:12:42.877',
        UpdatedOn: '2026-10-12T08:30:15.000',
        CreatedBy: 1,
        UpdatedBy: 2,
      },
      { TdsRateId: 8, IsPanAvailable: false, TdsRate: 20, Remarks: 'No PAN', Stratus: 1, StatusName: 'Active' },
    ],
  });
  mount(<TdsConfiguration />);
  await screen.findByText('Existing rate');
  const table = screen.getByRole('table', { name: 'TDS configuration' });
  expect(within(table).getByRole('cell', { name: 'Yes' })).toBeDefined();
  expect(within(table).getByRole('cell', { name: 'No' })).toBeDefined();
  expect(within(table).queryByRole('columnheader', { name: /Stratus|Status Name|^Status/ })).toBeNull();
  expect(within(table).queryByRole('columnheader', { name: /Created By|Updated By/ })).toBeNull();
  expect(within(table).getByRole('cell', { name: '2026-10-11' })).toBeDefined();
  expect(within(table).getByRole('cell', { name: '2026-10-12' })).toBeDefined();
  expect(request).toHaveBeenCalledWith(
    '/Config/GetTdsMasters',
    expect.objectContaining({ method: 'POST', body: { IsPanAvailable: null, Stratus: null } }),
  );

  fireEvent.click(screen.getByRole('button', { name: 'Create TDS rate' }));
  const form = await screen.findByRole('dialog');
  fireEvent.change(within(form).getByLabelText(title('IsPanAvailable')), { target: { value: 'true' } });
  fireEvent.change(within(form).getByLabelText(title('TdsRate')), { target: { value: '3.25' } });
  fireEvent.change(within(form).getByLabelText(title('Remarks')), { target: { value: 'New rate' } });
  fireEvent.change(within(form).getByLabelText('Status'), { target: { value: '0' } });
  fireEvent.click(within(form).getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith(
      '/Config/CreateTdsMaster',
      expect.objectContaining({
        method: 'POST',
        body: { IsPanAvailable: true, TdsRate: 3.25, Remarks: 'New rate', Stratus: 0 },
      }),
    ),
  );
});
it.each(['topup', 'commissionDistributionSetup', 'transaction', 'serviceAgencyCharge'])(
  'lists, views, creates and deletes %s records',
  async (key) => {
    const resource = configResources[key];
    vi.mocked(request).mockResolvedValue({
      Result: [{ [resource.id]: 7, Status: 1, Description: 'Existing record' }],
    });
    mount(
      key === 'commissionDistributionSetup' ? (
        <CommissionDistributionComponent />
      ) : (
        <ConfigCrudComponent resourceKey={key} />
      ),
    );
    await screen.findByText('Existing record');
    expect(request).toHaveBeenCalledWith(
      `/Config/${resource.list}`,
      expect.objectContaining({
        method: ['serviceAgencyCharge', 'commissionDistributionSetup'].includes(key)
          ? 'POST'
          : 'GET',
      }),
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
it('uses four search columns and hides creator/updater fields on commission setup grid', async () => {
  vi.mocked(request).mockResolvedValue({
    Result: [{
      DistributionId: 7,
      AgencyName: 'Example agency',
      ServiceName: 'Example service',
      PlanName: 'Example plan',
      CalculationTypeName: 'Example calculation',
      AgancyValue: 1,
      OrgValue: 2,
      MdsValue: 3,
      DSValue: 4,
      AgentValue: 5,
      StatusName: 'Active',
      CreatedBy: '1',
      CreatedByName: 'Created user',
      UpdatedBy: '2',
      UpdatedByName: 'Updated user',
      CreatedOn: '2026-10-11',
      UpdatedOn: '2026-10-12',
    }],
  });
  mount(<CommissionDistributionComponent />);
  await screen.findByText('Example agency');

  const page = screen.getByRole('heading', { name: 'Commission distribution setup' }).closest('section');
  expect(page?.querySelector('.commission-distribution-setup-search .master-form-grid')).not.toBeNull();
  const table = screen.getByRole('table', { name: 'Commission distribution setup' });
  expect(within(table).queryByRole('columnheader', { name: /Created By|Updated By/ })).toBeNull();
  expect(within(table).getByRole('cell', { name: '2026-10-11' })).toBeDefined();
  expect(within(table).getByRole('cell', { name: '2026-10-12' })).toBeDefined();
});
it('shows agency, service, slab and calculation names in the service agency charge grid', async () => {
  vi.mocked(request).mockResolvedValue({
    Result: [
      {
        MappingId: 7,
        AgencyID: 2,
        ServiceID: 2,
        SlabTypeId: 2,
        CalculationTypeId: 2,
        ServiceTypeName: 'Example service type',
        CreatedBy: '123',
        CreatedByName: 'Alex User',
        UpdatedBy: '456',
        UpdatedByName: 'Jordan User',
        FromAmount: 1,
        ToAmount: 999,
        CalculationValue: 5,
        Status: 1,
      },
    ],
  });
  mount(<ConfigCrudComponent resourceKey="serviceAgencyCharge" />);

  const grid = await screen.findByRole('table', { name: 'Service agency charge setup' });
  await within(grid).findByRole('cell', { name: 'Example agency' });
  expect(within(grid).getByRole('cell', { name: 'Example service' })).toBeDefined();
  expect(within(grid).getByRole('cell', { name: 'Example slab' })).toBeDefined();
  expect(within(grid).getByRole('cell', { name: 'Example calculation' })).toBeDefined();
  expect(within(grid).getByRole('button', { name: /Agency Name/ })).toBeDefined();
  expect(within(grid).getByRole('button', { name: /Service Name/ })).toBeDefined();
  expect(within(grid).getByRole('button', { name: /Slab Type Name/ })).toBeDefined();
  expect(within(grid).getByRole('button', { name: /Calculation Type Name/ })).toBeDefined();
  expect(within(grid).queryByRole('button', { name: /Agency ID/ })).toBeNull();
  expect(within(grid).queryByRole('button', { name: /Service ID/ })).toBeNull();
  expect(within(grid).queryByRole('button', { name: /Slab Type ID/ })).toBeNull();
  expect(within(grid).queryByRole('button', { name: /Calculation Type ID/ })).toBeNull();
  expect(within(grid).queryByRole('button', { name: /^Status/ })).toBeNull();
  expect(within(grid).queryByRole('button', { name: /Service Type Name/ })).toBeNull();
  expect(within(grid).getByRole('button', { name: /Created By Name/ })).toBeDefined();
  expect(within(grid).getByRole('cell', { name: 'Alex User' })).toBeDefined();
  expect(within(grid).getByRole('button', { name: /Updated By Name/ })).toBeDefined();
  expect(within(grid).getByRole('cell', { name: 'Jordan User' })).toBeDefined();
  expect(within(grid).queryByRole('button', { name: /^Created By\s*[↕↑↓]?$/ })).toBeNull();
  expect(within(grid).queryByRole('button', { name: /^Updated By\s*[↕↑↓]?$/ })).toBeNull();

  expect(
    document.querySelector('.service-agency-charge-search .master-form-grid'),
  ).not.toBeNull();
});
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
