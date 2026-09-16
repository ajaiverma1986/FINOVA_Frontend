import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { NotificationService } from '../../services/NotificationService';
import { ErrorState, Loading } from '../../components/Status';
import { ResultView } from '../../components/ResultView';
import { templateId, templateListPath, templateRecords } from './templates';

export default function TemplatePage() {
  const [params] = useSearchParams();
  const id = templateId(params.get('id'));
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
  return (
    <section className="card gateway-editor">
      <Link className="gateway-back" to={templateListPath}>
        Back to notification templates
      </Link>
      <h1>Notification template details</h1>
      <p className="gateway-subtitle">Template #{id}</p>
      {!query.data ? (
        <p>No notification template found.</p>
      ) : (
        <>
          <ResultView value={query.data} name="Notification template" />
          <Link className="button" to={`${templateListPath}/Edit?id=${id}`}>
            Edit template
          </Link>
        </>
      )}
    </section>
  );
}
