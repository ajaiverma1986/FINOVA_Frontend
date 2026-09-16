import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { CreateTemplateRequest } from '../../models/RequestModel/NotificationRequest';
import { ErrorState } from '../../components/Status';
import { NotificationService } from '../../services/NotificationService';
import { templateListPath } from './templates';

function records(result: unknown): Record<string, unknown>[] {
  if (!Array.isArray(result))
    return result && typeof result === 'object' ? [result as Record<string, unknown>] : [];
  return result.filter(
    (row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object',
  );
}

function value(row: Record<string, unknown>, ...keys: string[]) {
  const key = keys.find((candidate) => row[candidate] != null);
  return key ? String(row[key]) : '';
}

export default function TemplateForm({
  initial = {},
  editing = false,
  onSave,
}: {
  initial?: CreateTemplateRequest;
  editing?: boolean;
  onSave: (values: CreateTemplateRequest) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const saving = useRef(false);
  const templateTypes = useQuery({
    queryKey: ['notification-template-types', 'form'],
    retry: false,
    queryFn: async ({ signal }) =>
      records((await NotificationService.GetAllTemplateTypes(signal)).Result),
  });
  const serviceTypes = useQuery({
    queryKey: ['notification-service-types', 'form'],
    retry: false,
    queryFn: async ({ signal }) =>
      records((await NotificationService.GetAllServiceTypes(signal)).Result),
  });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const data = new FormData(event.currentTarget);
    const type = String(data.get('TemplateTypeId') || '').trim();
    const values: CreateTemplateRequest = {
      TemplateTypeId: type ? Number(type) : null,
      ServiceType: String(data.get('ServiceType') || '').trim(),
      TemplateName: String(data.get('TemplateName') || '').trim(),
      TemplateMsg: String(data.get('TemplateMsg') || '').trim(),
      Status: Number(data.get('Status')),
    };
    saving.current = true;
    setPending(true);
    setError(undefined);
    try {
      await onSave(values);
    } catch (cause) {
      setError(cause);
    } finally {
      saving.current = false;
      setPending(false);
    }
  }
  return (
    <form className="gateway-form" onSubmit={submit} aria-busy={pending}>
      {error != null && <ErrorState error={error} />}
      <fieldset disabled={pending || templateTypes.isFetching || serviceTypes.isFetching}>
        <div className="gateway-section-heading">
          <span>01</span>
          <div>
            <h2>Template identity</h2>
            <p>Define where this notification template is used.</p>
          </div>
        </div>
        <div className="form-grid">
          <label className="field">
            Template name
            <input name="TemplateName" required defaultValue={initial.TemplateName ?? ''} />
          </label>
          <label className="field">
            Template type
            <select name="TemplateTypeId" defaultValue={initial.TemplateTypeId ?? ''} required>
              <option value="">
                {templateTypes.isFetching ? 'Loading template types...' : 'Select template type'}
              </option>
              {templateTypes.data?.map((row, index) => {
                const id = value(row, 'TemplateTypeId', 'TemplateTypeID', 'Id');
                return id ? (
                  <option key={`${id}-${index}`} value={id}>
                    {value(row, 'TemplateTypeName', 'Name') || id}
                  </option>
                ) : null;
              })}
            </select>
            {templateTypes.isError && <small>Unable to load template types.</small>}
          </label>
          <label className="field">
            Service type
            <select name="ServiceType" defaultValue={initial.ServiceType ?? ''} required>
              <option value="">
                {serviceTypes.isFetching ? 'Loading service types...' : 'Select service type'}
              </option>
              {serviceTypes.data?.map((row, index) => {
                const id = value(row, 'ServiceTypeId', 'ServiceTypeID', 'Id');
                const name = value(row, 'ServiceTypeName', 'ServiceName', 'Name');
                const optionValue = name || id;
                return optionValue ? (
                  <option key={`${optionValue}-${index}`} value={optionValue}>
                    {name || optionValue}
                  </option>
                ) : null;
              })}
            </select>
            {serviceTypes.isError && <small>Unable to load service types.</small>}
          </label>
          <label className="field">
            Status
            <select name="Status" defaultValue={initial.Status ?? 0} required>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </label>
        </div>
        <div className="gateway-section-heading">
          <span>02</span>
          <div>
            <h2>Message content</h2>
            <p>Use the message body expected by the email or SMS delivery process.</p>
          </div>
        </div>
        <label className="field">
          Template message
          <textarea name="TemplateMsg" required rows={8} defaultValue={initial.TemplateMsg ?? ''} />
        </label>
        <div className="actions">
          <button type="submit">
            {pending ? 'Saving...' : editing ? 'Save changes' : 'Create template'}
          </button>
          {!pending && (
            <Link className="button secondary" to={templateListPath}>
              Cancel
            </Link>
          )}
        </div>
      </fieldset>
    </form>
  );
}
