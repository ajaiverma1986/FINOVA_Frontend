import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../../services/NotificationService';
import { ErrorState, Loading } from '../../components/Status';
import { DataTable } from '../../components/DataTable';
import {
  templateListPath,
  templateQueryKey,
  templateRecords,
  type NotificationTemplate,
} from './templates';
import './TemplateList.css';

export default function TemplateListPage() {
  const location = useLocation();
  const [activeOnly, setActiveOnly] = useState(false);
  const [deleting, setDeleting] = useState<NotificationTemplate | null>(null);
  const [message, setMessage] = useState(
    (location.state as { message?: string } | null)?.message || '',
  );
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: [...templateQueryKey, { activeOnly }],
    retry: false,
    queryFn: async ({ signal }) => {
      const response = activeOnly
        ? await NotificationService.GetActiveTemplates({}, signal)
        : await NotificationService.GetAllTemplates({}, signal);
      return templateRecords(response.Result);
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => NotificationService.DeleteTemplate(id),
    onSuccess: async () => {
      setDeleting(null);
      setMessage('Notification template deleted.');
      await cache.invalidateQueries({ queryKey: templateQueryKey });
    },
  });
  return (
    <section className="card template-list">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Notifications</p>
          <h1>Notification templates</h1>
        </div>
        <Link className="button" to={`${templateListPath}/Create`}>
          Create template
        </Link>
      </div>
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      <div className="actions">
        <label>
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => setActiveOnly(event.target.checked)}
          />{' '}
          Active templates only
        </label>
        <button
          type="button"
          className="secondary"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Refresh
        </button>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <DataTable
          data={query.data}
          name="Notification templates"
          columns={['TemplateID', 'TemplateName', 'TemplateTypeId', 'ServiceType', 'Status']}
          renderActions={(record) => {
            const row = record as unknown as NotificationTemplate;
            return (
              <div className="template-actions">
                <Link
                  className="button template-action template-action-view"
                  aria-label={`View ${row.TemplateName || 'template'}`}
                  to={`${templateListPath}/View?id=${row.TemplateID}`}
                >
                  View
                </Link>
                <Link
                  className="button template-action template-action-edit"
                  aria-label={`Edit ${row.TemplateName || 'template'}`}
                  to={`${templateListPath}/Edit?id=${row.TemplateID}`}
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="button template-action template-action-delete"
                  aria-label={`Delete ${row.TemplateName || 'template'}`}
                  disabled={remove.isPending}
                  onClick={() => {
                    remove.reset();
                    setDeleting(row);
                  }}
                >
                  Delete
                </button>
              </div>
            );
          }}
        />
      )}
      {deleting && (
        <section className="notice" role="alertdialog" aria-labelledby="delete-template-title">
          <h2 id="delete-template-title">Delete template {deleting.TemplateID}?</h2>
          <p>This will remove {deleting.TemplateName}.</p>
          {remove.isError && <ErrorState error={remove.error} />}
          <div className="actions">
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => remove.mutate(deleting.TemplateID)}
            >
              {remove.isPending ? 'Deleting...' : 'Confirm delete'}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={remove.isPending}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
