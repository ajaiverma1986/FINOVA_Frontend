import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MasterDataService } from '../../services/MasterDataService';
import { ErrorState } from '../../components/Status';
import type { ConfigField } from './configResources';

const lookups = {
  calculation: {
    label: 'Calculation type', id: 'CalculationTypeId', name: 'CalculationTypeName',
    load: (signal?: AbortSignal) => MasterDataService.getActiveCalculationTypes(signal),
  },
  plan: {
    label: 'Plan',
    id: 'PlanID',
    name: 'PlanName',
    load: (signal?: AbortSignal) => MasterDataService.getActivePlans(signal),
  },
  agency: {
    label: 'Agency',
    id: 'AgencyId',
    name: 'AgencyName',
    load: (signal?: AbortSignal) => MasterDataService.getActiveAgencies(signal),
  },
  service: {
    label: 'Service',
    id: 'ServiceId',
    name: 'ServiceName',
    load: (signal?: AbortSignal) => MasterDataService.getAllServices(signal),
  },
  slab: {
    label: 'Slab type',
    id: 'SlabTypId',
    name: 'SlabTypeName',
    load: (signal?: AbortSignal) => MasterDataService.getActiveSlabTypes(signal),
  },
};
export function configLookupKind(key: string): keyof typeof lookups | undefined {
  const fields: Record<string, keyof typeof lookups> = {
    planid: 'plan',
    agencyid: 'agency',
    serviceid: 'service',
    slabtype: 'slab',
    slabtypeid: 'slab',
    calculationtype: 'calculation',
    calculationtypeid: 'calculation',
  };
  return fields[key.toLowerCase()];
}
function rows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === 'object');
  if (value && typeof value === 'object') {
    const nested = Object.values(value).find(Array.isArray);
    return nested ? rows(nested) : [value as Record<string, unknown>];
  }
  return [];
}
function get(row: Record<string, unknown>, key: string) {
  return row[Object.keys(row).find((name) => name.toLowerCase() === key.toLowerCase()) ?? key];
}
export default function ConfigLookup({
  field,
  initial,
  kind,
}: {
  field: ConfigField;
  initial: unknown;
  kind: keyof typeof lookups;
}) {
  const lookup = lookups[kind];
  const [selected, setSelected] = useState(String(initial ?? ''));
  const query = useQuery({
    queryKey: ['config-lookups', kind],
    queryFn: async ({ signal }) => rows((await lookup.load(signal)).Result),
    retry: false,
  });
  const options = (query.data ?? [])
    .map((row) => ({ id: Number(get(row, lookup.id)), name: String(get(row, lookup.name) ?? '') }))
    .filter((option) => Number.isFinite(option.id) && option.id > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="master-field">
      <label>
        {lookup.label}
        <select
          name={field.key}
          required={!field.nullable}
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          aria-busy={query.isFetching}
        >
          <option value="">
            {query.isPending
              ? `Loading ${lookup.label.toLowerCase()} options...`
              : `Select ${lookup.label.toLowerCase()}`}
          </option>
          {selected && !options.some((option) => String(option.id) === selected) && (
            <option value={selected}>
              Current selection ({selected}){query.isSuccess ? ' — unavailable' : ''}
            </option>
          )}
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
      {query.isError && <ErrorState error={query.error} retry={() => void query.refetch()} />}
      {query.isSuccess && !options.length && (
        <small>No {lookup.label.toLowerCase()} options available.</small>
      )}
    </div>
  );
}
