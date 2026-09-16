import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ErrorState, Loading } from '../../components/Status';
import { DataTable } from '../../components/DataTable';
import { NotificationService } from '../../services/NotificationService';
import { templateListPath } from './templates';

function rows(value: unknown): Record<string, unknown>[] {
  if (value && !Array.isArray(value) && typeof value === 'object')
    return [value as Record<string, unknown>];
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object',
  );
}

function text(row: Record<string, unknown>, ...keys: string[]) {
  const key = keys.find((candidate) => row[candidate] != null);
  return key ? String(row[key]) : '-';
}

export default function ServiceTypeListPage() {
  const query = useQuery({
    queryKey: ['notification-service-types'],
    retry: false,
    queryFn: async ({ signal }) =>
      rows((await NotificationService.GetAllServiceTypes(signal)).Result),
  });
  return (
    <section className="card">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Notifications</p>
          <h1>Service types</h1>
        </div>
        <div className="actions">
          <Link className="button" to="/Dashboard/Notifications/ServiceTypes/Create">
            Create service type
          </Link>
        </div>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <DataTable data={query.data} name="Notification service types" />
      )}
    </section>
  );
}
