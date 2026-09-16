import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../../services/NotificationService';
import { ErrorState, Loading } from '../../components/Status';
import { ResultView } from '../../components/ResultView';
import EmailGatewayForm from './EmailGatewayForm';
import {
  gatewayId,
  gatewayQueryKey,
  gatewayRecords,
  emailGatewayListPath,
  notificationPath,
} from './gateways';

export default function EmailGatewayPage({ editing = false }: { editing?: boolean }) {
  const [params] = useSearchParams();
  const id = gatewayId(params.get('id'));
  const navigate = useNavigate();
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: [...gatewayQueryKey, id],
    enabled: id !== null,
    retry: false,
    queryFn: async ({ signal }) =>
      gatewayRecords((await NotificationService.GetEmailGatewayByID(id!, signal)).Result).find(
        (row) => row.EmailGatewayID === id,
      ),
  });
  if (id === null) return <ErrorState error={new Error('A valid email gateway ID is required.')} />;
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  return (
    <section className="card gateway-editor">
      <Link className="gateway-back" to={emailGatewayListPath}>
        <span aria-hidden="true">← </span>Back to email gateways
      </Link>
      <h1>{editing ? 'Edit email gateway' : 'Email gateway details'}</h1>
      <p className="gateway-subtitle">
        Gateway #{id}
        {editing
          ? ' · Update your email delivery settings below.'
          : ' · Email delivery configuration.'}
      </p>
      {!query.data ? (
        <p>No email gateway found.</p>
      ) : editing ? (
        <EmailGatewayForm
          key={id}
          editing
          initial={query.data}
          onSave={async (values) => {
            await NotificationService.UpdateEmailGateway({ ...values, EmailGatewayID: id });
            await cache.invalidateQueries({ queryKey: gatewayQueryKey });
            navigate(emailGatewayListPath, { state: { message: 'Email gateway updated.' } });
          }}
        />
      ) : (
        <>
          <ResultView value={query.data} name="Email gateway" />
          <Link className="button" to={`${notificationPath}/Edit?id=${id}`}>
            Edit gateway
          </Link>
        </>
      )}
    </section>
  );
}
