import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../../services/NotificationService';
import { ErrorState, Loading } from '../../components/Status';
import { ResultView } from '../../components/ResultView';
import SMSGatewayForm from './SMSGatewayForm';
import {
  gatewayId,
  gatewayQueryKey,
  gatewayRecords,
  smsGatewayListPath,
  notificationPath,
} from './smsGateways';

export default function SMSGatewayPage({ editing = false }: { editing?: boolean }) {
  const [params] = useSearchParams();
  const id = gatewayId(params.get('id'));
  const navigate = useNavigate();
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: [...gatewayQueryKey, id],
    enabled: id !== null,
    retry: false,
    queryFn: async ({ signal }) =>
      gatewayRecords((await NotificationService.GetSMSGatewayByID(id!, signal)).Result).find(
        (row) => row.SMSGatewayID === id,
      ),
  });
  if (id === null) return <ErrorState error={new Error('A valid SMS gateway ID is required.')} />;
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  return (
    <section className="card gateway-editor">
      <Link className="gateway-back" to={smsGatewayListPath}>
        <span aria-hidden="true">← </span>Back to SMS gateways
      </Link>
      <h1>{editing ? 'Edit SMS gateway' : 'SMS gateway details'}</h1>
      <p className="gateway-subtitle">
        Gateway #{id}
        {editing ? ' · Update your SMS delivery settings below.' : ' · SMS delivery configuration.'}
      </p>
      {!query.data ? (
        <p>No SMS gateway found.</p>
      ) : editing ? (
        <SMSGatewayForm
          key={id}
          editing
          initial={query.data}
          onSave={async (values) => {
            await NotificationService.UpdateSMSGateway({ ...values, SMSGatewayID: id });
            await cache.invalidateQueries({ queryKey: gatewayQueryKey });
            navigate(smsGatewayListPath, { state: { message: 'SMS gateway updated.' } });
          }}
        />
      ) : (
        <>
          <ResultView value={query.data} name="SMS gateway" />
          <Link className="button" to={`${notificationPath}/Edit?id=${id}`}>
            Edit gateway
          </Link>
        </>
      )}
    </section>
  );
}
