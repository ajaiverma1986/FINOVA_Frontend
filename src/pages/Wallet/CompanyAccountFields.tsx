import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OrgMgrService } from '../../services/OrgMgrService';
import { AppMgrService } from '../../services/AppMgrService';
import { MasterDataService } from '../../services/MasterDataService';
import { ErrorState } from '../../components/Status';
import { title } from '../../components/DataTable';
import { records, value } from './payinRequests';
import { readValues as readConfigValues } from '../Configuration/ConfigFields';
import type { ConfigField } from '../Configuration/configResources';
import type { Values } from './companyAccountResources';

export function readValues(form: HTMLFormElement, fields: ConfigField[]): Values {
  const values: Values = readConfigValues(
    form,
    fields.filter((field) => field.type !== 'file'),
  );
  const data = new FormData(form);
  for (const field of fields.filter((field) => field.type === 'file')) {
    const file = data.get(field.key);
    values[field.key] = file instanceof File && file.name ? file : null;
  }
  return values;
}

const lookups = {
  OrganizationId: {
    label: 'Company name',
    name: 'OrganizationName',
    load: (signal?: AbortSignal) => OrgMgrService.getActiveOrganizations(signal),
  },
  ApplicationId: {
    label: 'Application name',
    name: 'ApplicationName',
    load: (signal?: AbortSignal) => AppMgrService.getActiveApplications(signal),
  },
  BankId: {
    label: 'Bank name',
    name: 'BankName',
    load: (signal?: AbortSignal) => MasterDataService.getActiveBanks(signal),
  },
};
function AccountLookup({ field, initial }: { field: ConfigField; initial: unknown }) {
  const lookup = lookups[field.key as keyof typeof lookups];
  const [selected, setSelected] = useState(String(initial ?? ''));
  const query = useQuery({
    queryKey: ['company-account-lookups', field.key],
    queryFn: async ({ signal }) => records((await lookup.load(signal)).Result),
    retry: false,
  });
  const options = (query.data ?? [])
    .map((row) => ({
      id: String(value(row, field.key) ?? ''),
      name: String(value(row, lookup.name) ?? value(row, 'DisplayName') ?? ''),
    }))
    .filter((option) => Number(option.id) > 0)
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
            {query.isPending ? 'Loading...' : `Select ${lookup.label.toLowerCase()}`}
          </option>
          {selected && !options.some((option) => option.id === selected) && (
            <option value={selected}>Current selection ({selected})</option>
          )}
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name || option.id}
            </option>
          ))}
        </select>
      </label>
      {query.isError && <ErrorState error={query.error} retry={() => void query.refetch()} />}
      {query.isSuccess && !options.length && <small>No options available.</small>}
    </div>
  );
}
export default function CompanyAccountFields({
  fields,
  initial = {},
}: {
  fields: ConfigField[];
  initial?: Record<string, unknown>;
}) {
  return (
    <div className="master-form-grid">
      {fields.map((field) => {
        const current = value(initial, field.key) ?? (field.key === 'Status' ? 1 : '');
        if (field.key in lookups)
          return <AccountLookup key={field.key} field={field} initial={current} />;
        return (
          <label className="master-field" key={field.key}>
            {field.type === 'file' ? 'Attachment' : title(field.key)}
            {field.key === 'AccountType' ? (
              <select name={field.key} defaultValue={String(current)}>
                <option value="">Select account type</option>
                <option value="1">Bank Account</option>
                <option value="2">UPI</option>
              </select>
            ) : field.key === 'Status' ? (
              <select name={field.key} defaultValue={String(current)}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            ) : field.type === 'file' ? (
              <input name={field.key} type="file" />
            ) : (
              <input
                name={field.key}
                type={field.type === 'string' ? 'text' : 'number'}
                step={field.type === 'integer' ? '1' : 'any'}
                required={!field.nullable}
                defaultValue={String(current)}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}
