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
        const value = initialKey ? initial[initialKey] : field.key === 'Status' ? 1 : '';
        const kind = configLookupKind(field.key);
        if (kind) return <ConfigLookup key={field.key} field={field} initial={value} kind={kind} />;
        return (
          <label className="master-field" key={field.key}>
            {title(field.key)}
            {field.key === 'Status' ? (
              <select name={field.key} defaultValue={String(value ?? 1)}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
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
