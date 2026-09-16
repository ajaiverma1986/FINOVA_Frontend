import { useState } from 'react';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import './EmailGatewayList.css';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../../services/NotificationService';
import { ErrorState, Loading } from '../../components/Status';
import { DataTable } from '../../components/DataTable';
import { gatewayQueryKey, gatewayRecords, notificationPath, type EmailGateway } from './gateways';

export default function EmailGatewayList({ initialMessage = '' }: { initialMessage?: string }) {
  const [activeOnly, setActiveOnly] = useState(false);
  const [deleting, setDeleting] = useState<EmailGateway | null>(null);

  const [message, setMessage] = useState<string>(initialMessage);
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: [...gatewayQueryKey, { activeOnly }],
    retry: false,
    queryFn: async ({ signal }) =>
      gatewayRecords(
        (
          await (activeOnly
            ? NotificationService.GetActiveEmailGateway(signal)
            : NotificationService.GetAllEmailGateways(signal))
        ).Result,
      ),
  });
  const remove = useMutation({
    mutationFn: (id: number) => NotificationService.DeleteEmailGateway(id),
    onSuccess: async () => {
      setDeleting(null);
      setMessage('Email gateway deleted.');
      await cache.invalidateQueries({ queryKey: gatewayQueryKey });
    },
  });
  return (
    <section className="card email-gateway-list">
      <div className="page-heading">
        <h1>Notification email gateways</h1>
        <Link className="button" to={`${notificationPath}/Create`}>
          Create gateway
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
          Active gateway only
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
          name="Email gateways"
          emptyMessage="No email gateways found."
          columns={[
            'EmailGatewayID',
            'SMTPServer',
            'SMTPPort',
            'SMTPSenderEmail',
            'SMTPEnableSSL',
            'Status',
          ]}
          renderActions={(record) => {
            const row = record as unknown as EmailGateway;
            return (
              <div className="actions">
                <Link
                  className="gateway-action gateway-action-view"
                  to={`${notificationPath}/View?id=${row.EmailGatewayID}`}
                >
                  <VisibilityOutlinedIcon fontSize="small" /> View
                </Link>
                <Link
                  className="gateway-action gateway-action-edit"
                  to={`${notificationPath}/Edit?id=${row.EmailGatewayID}`}
                >
                  <EditOutlinedIcon fontSize="small" /> Edit
                </Link>
                <button
                  type="button"
                  className="gateway-action gateway-action-delete"
                  disabled={remove.isPending}
                  onClick={() => {
                    remove.reset();
                    setDeleting(row);
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" /> Delete
                </button>
              </div>
            );
          }}
        />
      )}
      {deleting && (
        <section
          role="alertdialog"
          aria-modal="false"
          aria-labelledby="delete-gateway-title"
          className="notice"
        >
          <h2 id="delete-gateway-title">Delete email gateway {deleting.EmailGatewayID}?</h2>
          <p>This will remove the gateway for {deleting.SMTPServer}.</p>
          {remove.isError && <ErrorState error={remove.error} />}
          <div className="actions">
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => remove.mutate(deleting.EmailGatewayID)}
            >
              {remove.isPending ? 'Deleting…' : 'Confirm delete'}
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
