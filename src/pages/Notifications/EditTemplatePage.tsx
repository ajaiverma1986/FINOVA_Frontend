import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../../services/NotificationService';
import { ErrorState, Loading } from '../../components/Status';
import TemplateForm from './TemplateForm';
import { templateId, templateListPath, templateQueryKey, templateRecords } from './templates';

export default function EditTemplatePage() {
  const [params] = useSearchParams();
  const id = templateId(params.get('id'));
  const navigate = useNavigate();
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ['notification-template', id],
    enabled: id !== null,
    retry: false,
    queryFn: async ({ signal }) =>
      templateRecords((await NotificationService.GetTemplateByID(id!, signal)).Result).find(
        (row) => row.TemplateID === id,
      ),
  });
  if (id === null)
    return <ErrorState error={new Error('A valid notification template ID is required.')} />;
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data)
    return (
      <section className="card">
        <p>No notification template found.</p>
      </section>
    );
  return (
    <section className="card gateway-editor">
      <h1>Edit notification template</h1>
      <p className="gateway-subtitle">Template #{id}</p>
      <TemplateForm
        editing
        initial={query.data}
        onSave={async (values) => {
          await NotificationService.UpdateTemplate({ ...values, TemplateID: id });
          await cache.invalidateQueries({ queryKey: templateQueryKey });
          navigate(templateListPath, { state: { message: 'Notification template updated.' } });
        }}
      />
    </section>
  );
}
