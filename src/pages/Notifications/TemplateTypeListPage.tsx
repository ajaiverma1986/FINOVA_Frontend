import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorState, Loading } from '../../components/Status';
import { DataTable } from '../../components/DataTable';
import { NotificationService } from '../../services/NotificationService';
import { templateListPath } from './templates';
import type { TemplateType } from '../../models/RequestModel/NotificationRequest';
import './TemplateTypeList.css';

function templateTypes(result: unknown): TemplateType[] {
  if (result == null) return [];
  const rows = Array.isArray(result) ? result : [result];
  return rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const value = row as Record<string, unknown>;
    const id = Number(value.TemplateTypeId ?? value.TemplateTypeID ?? value.Id);
    return Number.isSafeInteger(id) && id > 0
      ? [{ ...value, TemplateTypeId: id } as TemplateType]
      : [];
  });
}

export default function TemplateTypeListPage() {
  const [viewing, setViewing] = useState<TemplateType | null>(null);
  const [deleting, setDeleting] = useState<TemplateType | null>(null);
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ['notification-template-types'],
    retry: false,
    queryFn: async ({ signal }) => {
      return templateTypes((await NotificationService.GetAllTemplateTypes(signal)).Result);
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => NotificationService.DeleteTemplateType(id),
    onSuccess: async () => {
      setDeleting(null);
      await cache.invalidateQueries({ queryKey: ['notification-template-types'] });
    },
  });
  return (
    <section className="card template-type-list">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Notifications</p>
          <h1>Template types</h1>
        </div>
        <Link className="button" to="/Dashboard/Notifications/TemplateTypes/Create">
          Create template type
        </Link>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <DataTable
          data={query.data}
          name="Notification template types"
          columns={['TemplateTypeId', 'TemplateTypeName', 'Description', 'StatusName', 'Status']}
          renderActions={(record) => {
            const type = record as unknown as TemplateType;
            return (
              <div className="actions">
                <button type="button" className="secondary" onClick={() => setViewing(type)}>
                  View
                </button>
                <button
                  type="button"
                  className="secondary template-type-delete"
                  disabled={remove.isPending}
                  onClick={() => {
                    remove.reset();
                    setDeleting(type);
                  }}
                >
                  Delete
                </button>
              </div>
            );
          }}
        />
      )}
      {viewing && (
        <section className="notice" role="dialog" aria-labelledby="template-type-details-title">
          <h2 id="template-type-details-title">Template type details</h2>
          <p>
            <strong>ID:</strong> {viewing.TemplateTypeId}
          </p>
          <p>
            <strong>Name:</strong> {viewing.TemplateTypeName || '-'}
          </p>
          <p>
            <strong>Description:</strong> {viewing.Description || '-'}
          </p>
          <p>
            <strong>Status:</strong> {viewing.StatusName || (viewing.Status ?? '-')}
          </p>
          <button type="button" className="secondary" onClick={() => setViewing(null)}>
            Close
          </button>
        </section>
      )}
      {deleting && (
        <section className="notice" role="alertdialog" aria-labelledby="delete-template-type-title">
          <h2 id="delete-template-type-title">
            Delete template type {deleting.TemplateTypeName || deleting.TemplateTypeId}?
          </h2>
          <p>This action cannot be undone.</p>
          {remove.isError && <ErrorState error={remove.error} />}
          <div className="actions">
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => remove.mutate(deleting.TemplateTypeId)}
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
