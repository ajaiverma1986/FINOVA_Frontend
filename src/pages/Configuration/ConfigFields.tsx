import { title } from '../../components/DataTable';
import type { ConfigField, Values } from './configResources';
import ConfigLookup, { configLookupKind } from './ConfigLookup';

export function readValues(form: HTMLFormElement, fields: ConfigField[]): Values {
  const data = new FormData(form);
  return Object.fromEntries(
    fields.map((field) => {
      const raw = String(data.get(field.key) ?? '').trim();
      return [
        field.key,
        raw === '' && field.nullable
          ? null
          : field.type === 'boolean'
            ? raw === 'true'
            : ['number', 'integer'].includes(field.type)
            ? Number(raw)
            : raw,
      ];
    }),
  );
}

export default function ConfigFields({
  fields,
  initial = {},
}: {
  fields: ConfigField[];
  initial?: Record<string, unknown>;
}) {
  return (
    <div className="master-form-grid">
      {fields.map((field) => {
        const initialKey = Object.keys(initial).find(
          (key) => key.toLowerCase() === field.key.toLowerCase(),
        );
        const isStatus = field.key === 'Status' || field.key === 'Stratus';
        const value = initialKey ? initial[initialKey] : isStatus && !field.nullable ? 1 : '';
        const kind = configLookupKind(field.key);
        if (kind) return <ConfigLookup key={field.key} field={field} initial={value} kind={kind} />;
        return (
          <label className="master-field" key={field.key}>
            {isStatus ? 'Status' : title(field.key)}
            {isStatus ? (
              <select name={field.key} defaultValue={String(value ?? '')}>
                {field.nullable && <option value="">All statuses</option>}
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            ) : field.type === 'boolean' ? (
              <select name={field.key} defaultValue={String(value ?? '')} required={!field.nullable}>
                {field.nullable && <option value="">All</option>}
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : (
              <input
                name={field.key}
                type={field.type === 'string' ? 'text' : 'number'}
                step={field.type === 'integer' ? '1' : 'any'}
                required={!field.nullable}
                defaultValue={String(value ?? '')}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}
