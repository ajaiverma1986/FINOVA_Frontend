import { useRef, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useAuth } from '../../core/auth';
import { request } from '../../core/api';
import { WalletService } from '../../services/WalletService';
import { MasterDataService } from '../../services/MasterDataService';
import { UserMgrService } from '../../services/UserMgrservice';
import { DataTable } from '../../components/DataTable';
import { ErrorState, Loading } from '../../components/Status';
import FileViewer from '../../components/FileViewer';
import {
  cell,
  columns,
  documentUrl,
  PAYIN_STATUS,
  records,
  today,
  value,
  type PayinRow,
} from './payinRequests';
import '../Masters/MasterDataCrudPage.css';
import './CreatePayinRequest.css';

function accountOptions(result: unknown, idKey: string): PayinRow[] {
  const rows = records(result);
  const candidates = rows.length
    ? rows
    : result && typeof result === 'object' && !Array.isArray(result)
      ? [result as PayinRow]
      : [];
  return candidates.filter(
    (row) => Number.isSafeInteger(Number(value(row, idKey))) && Number(value(row, idKey)) > 0,
  );
}

export default function CreatePayinRequestComponent() {
  const { session } = useAuth();
  const profile = useQuery({
    queryKey: ['profile', session?.username, false],
    enabled: !!session,
    queryFn: ({ signal }) =>
      request<PayinRow>(
        '/User/GetUserMasterDetailsforConfig?UserName=' + encodeURIComponent(session!.username),
        { signal },
      ),
  });
  if (!session) return <ErrorState error={new Error('Sign in to create a pay-in request.')} />;
  if (profile.isPending) return <Loading />;
  if (profile.isError)
    return <ErrorState error={profile.error} retry={() => void profile.refetch()} />;
  const details = profile.data.Result ?? {};
  const userId = Number(value(details, 'UserMasterId') ?? value(details, 'UserId'));
  if (!Number.isSafeInteger(userId) || userId <= 0)
    return <ErrorState error={new Error('Your profile does not contain a valid user ID.')} />;
  return <PayinForm key={`${session.username}-${userId}`} userId={userId} />;
}

function PayinForm({ userId }: { userId: number }) {
  const cache = useQueryClient();
  const [channel, setChannel] = useState('');
  const [mode, setMode] = useState('');
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<PayinRow | null>(null);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [accountPreview, setAccountPreview] = useState<PayinRow | null>(null);
  const channels = useQuery({
    queryKey: ['wallet-payment-channels'],
    queryFn: ({ signal }) => MasterDataService.getActivePaymentChanels(signal),
    retry: false,
  });
  const modes = useQuery({
    queryKey: ['wallet-payment-modes'],
    queryFn: ({ signal }) => MasterDataService.getActivePaymentModes(signal),
    retry: false,
  });
  const accounts = useQuery({
    queryKey: ['payin-company-accounts'],
    queryFn: ({ signal }) => WalletService.getActiveCompanyAccounts(signal),
    retry: false,
  });
  const originators = useQuery({
    queryKey: ['payin-user-accounts', userId],
    queryFn: ({ signal }) => UserMgrService.getActiveUserBankAccountsByUserMasterId(userId, signal),
    retry: false,
  });
  const list = useQuery({
    queryKey: ['my-payin-requests', userId],
    queryFn: async ({ signal }) =>
      records((await WalletService.getPayinRequestsByUserMasterId(userId, signal)).Result),
    retry: false,
  });
  const availableModes = records(modes.data?.Result).filter(
    (row) => Number(value(row, 'PaymentChanelID')) === Number(channel),
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (key: string) => String(data.get(key) ?? '').trim();
    const optional = (key: string) => text(key) || null;
    const amount = Number(text('Amount'));
    const charge = Number(text('Charge'));
    setError(undefined);
    setMessage('');
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isFinite(charge) ||
      charge < 0 ||
      !records(channels.data?.Result).some(
        (row) => Number(value(row, 'PaymentChanelID')) === Number(channel),
      ) ||
      !availableModes.some((row) => Number(value(row, 'PaymentModeID')) === Number(mode))
    ) {
      setError(
        new Error(
          'Select a payment channel and mode, a positive amount, and a non-negative charge.',
        ),
      );
      return;
    }
    lock.current = true;
    setPending(true);
    try {
      await WalletService.createPayinRequest({
        UserMasterId: userId,
        PaymentChanelID: Number(channel),
        PaymentModeId: Number(mode),
        Amount: amount,
        Charge: charge,
        Status: PAYIN_STATUS.pending,
        OriginatorAccountId: text('OriginatorAccountId')
          ? Number(text('OriginatorAccountId'))
          : null,
        BenficiaryAccountId: text('BenficiaryAccountId')
          ? Number(text('BenficiaryAccountId'))
          : null,
        DepositDate: text('DepositDate') ? `${text('DepositDate')}T00:00:00` : null,
        RefNo1: optional('RefNo1'),
        RefNo2: optional('RefNo2'),
        Remarks: optional('Remarks'),
        File: receipt,
      });
      setReceipt(null);
      form.reset();
      setChannel('');
      setMode('');
      setMessage('Pay-in request created.');
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['my-payin-requests', userId] }),
        cache.invalidateQueries({ queryKey: ['wallet-payin-requests'] }),
      ]);
    } catch (caught) {
      setError(caught);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  const accountLabel = (row: PayinRow) =>
    [value(row, 'AccountName'), value(row, 'BankName'), value(row, 'AccountNo')]
      .filter(Boolean)
      .join(' · ');
  return (
    <section className="master-data-page create-payin-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Wallet</p>
          <h1>Create pay-in request</h1>
        </div>
      </div>
      {[channels, modes, accounts, originators].map((query, index) =>
        query.isError ? (
          <ErrorState key={index} error={query.error} retry={() => void query.refetch()} />
        ) : null,
      )}
      {error != null && <ErrorState error={error} />}
      {message && (
        <p role="status" className="notice success">
          {message}
        </p>
      )}
      <form className="card master-form" aria-label="Create pay-in request" onSubmit={submit}>
        <fieldset disabled={pending} style={{ border: 0, padding: 0, margin: 0 }}>
          <div className="master-form-grid">
            <label className="master-field">
              Payment channel
              <select
                required
                value={channel}
                disabled={!channels.isSuccess}
                onChange={(event) => {
                  setChannel(event.target.value);
                  setMode('');
                }}
              >
                <option value="">Select payment channel</option>
                {records(channels.data?.Result).map((row) => (
                  <option
                    key={String(value(row, 'PaymentChanelID'))}
                    value={String(value(row, 'PaymentChanelID'))}
                  >
                    {String(value(row, 'PaymentChanelName'))}
                  </option>
                ))}
              </select>
            </label>
            <label className="master-field">
              Payment mode
              <select
                required
                value={mode}
                disabled={!channel || !modes.isSuccess}
                onChange={(event) => setMode(event.target.value)}
              >
                <option value="">Select payment mode</option>
                {availableModes.map((row) => (
                  <option
                    key={String(value(row, 'PaymentModeID'))}
                    value={String(value(row, 'PaymentModeID'))}
                  >
                    {String(value(row, 'PaymentModeName'))}
                  </option>
                ))}
              </select>
            </label>
            <label className="master-field">
              Amount
              <input name="Amount" type="number" min="0.01" step="0.01" required />
            </label>
            <label className="master-field">
              Charge
              <input name="Charge" type="number" min="0" step="0.01" defaultValue="0" required />
            </label>
            <label className="master-field">
              Originator account
              <select name="OriginatorAccountId" disabled={!originators.isSuccess}>
                <option value="">
                  {originators.isPending
                    ? 'Loading originator accounts...'
                    : 'Select originator account (optional)'}
                </option>
                {accountOptions(originators.data?.Result, 'OriginatorAccountID').map((row) => (
                  <option
                    key={String(value(row, 'OriginatorAccountID'))}
                    value={String(value(row, 'OriginatorAccountID'))}
                  >
                    {accountLabel(row)}
                  </option>
                ))}
              </select>
              {originators.isSuccess &&
                !accountOptions(originators.data?.Result, 'OriginatorAccountID').length && (
                  <small>No active originator accounts available.</small>
                )}
            </label>
            <label className="master-field">
              Company account
              <select name="BenficiaryAccountId" disabled={!accounts.isSuccess}>
                <option value="">
                  {accounts.isPending
                    ? 'Loading company accounts...'
                    : 'Select company account (optional)'}
                </option>
                {accountOptions(accounts.data?.Result, 'CompanyAccountId').map((row) => (
                  <option
                    key={String(value(row, 'CompanyAccountId'))}
                    value={String(value(row, 'CompanyAccountId'))}
                  >
                    {accountLabel(row)}
                  </option>
                ))}
              </select>
              {accounts.isSuccess &&
                !accountOptions(accounts.data?.Result, 'CompanyAccountId').length && (
                  <small>No active company accounts available.</small>
                )}
            </label>
            <label className="master-field">
              Deposit date
              <input name="DepositDate" type="date" defaultValue={today()} />
            </label>
            <label className="master-field">
              Reference 1<input name="RefNo1" />
            </label>
            <label className="master-field">
              Reference 2<input name="RefNo2" />
            </label>
            <label className="master-field">
              Receipt (optional)
              <input
                name="Receipt"
                type="file"
                onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
              />
            </label>
            <label className="master-field">
              Remarks
              <textarea name="Remarks" rows={3} />
            </label>
          </div>
          <button type="submit" disabled={pending || !channels.isSuccess || !modes.isSuccess}>
            {pending ? 'Submitting...' : 'Create request'}
          </button>
        </fieldset>
      </form>
      <div className="page-heading">
        <h2>My pay-in requests</h2>
        <div className="master-actions">
          <button type="button" className="secondary" onClick={() => setAccountsOpen(true)}>
            View company accounts
          </button>
          <button
            type="button"
            className="secondary"
            disabled={list.isFetching}
            onClick={() => void list.refetch()}
          >
            Refresh
          </button>
        </div>
      </div>
      {list.isPending ? (
        <Loading />
      ) : list.isError ? (
        <ErrorState error={list.error} retry={() => void list.refetch()} />
      ) : (
        <DataTable
          name="My pay-in requests"
          data={(list.data ?? []).map((row) => ({
            ...Object.fromEntries(columns.map(([key, label]) => [label, cell(row, key)])),
            receipt: documentUrl(row).trim(),
          }))}
          columns={columns.map(([, label]) => label)}
          renderActions={(row) =>
            row.receipt ? (
              <button
                type="button"
                className="master-action view"
                style={{ whiteSpace: 'nowrap', minWidth: 'max-content' }}
                onClick={() => setPreview({ FileUrl: row.receipt, RequestID: row['Request ID'] })}
              >
                View receipt
              </button>
            ) : null
          }
        />
      )}
      <Dialog
        open={accountsOpen}
        onClose={() => setAccountsOpen(false)}
        fullWidth
        maxWidth="md"
        aria-labelledby="payin-company-accounts-title"
      >
        <DialogTitle id="payin-company-accounts-title">Company accounts</DialogTitle>
        <DialogContent className="master-data-page">
          {accounts.isPending ? (
            <Loading />
          ) : accounts.isError ? (
            <ErrorState error={accounts.error} retry={() => void accounts.refetch()} />
          ) : (
            <div className="master-table-wrap">
              <table aria-label="Company accounts">
                <thead>
                  <tr>
                    <th>Account name</th>
                    <th>Account number</th>
                    <th>IFSC code</th>
                    <th>Document</th>
                  </tr>
                </thead>
                <tbody>
                  {accountOptions(accounts.data?.Result, 'CompanyAccountId').map((account) => (
                    <tr key={String(value(account, 'CompanyAccountId'))}>
                      <td>{String(value(account, 'AccountName') ?? '')}</td>
                      <td>{String(value(account, 'AccountNo') ?? '')}</td>
                      <td>{String(value(account, 'Ifsccode') ?? '')}</td>
                      <td>
                        {documentUrl(account).trim() && (
                          <button
                            type="button"
                            className="master-action view"
                            style={{ whiteSpace: 'nowrap' }}
                            onClick={() => setAccountPreview(account)}
                          >
                            View document
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!accountOptions(accounts.data?.Result, 'CompanyAccountId').length && (
                    <tr>
                      <td colSpan={4}>No active company accounts available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {accountPreview && (
        <FileViewer
          open
          fileUrl={documentUrl(accountPreview).trim()}
          fileName={`${value(accountPreview, 'AccountName') || 'Company account'} document`}
          onClose={() => setAccountPreview(null)}
        />
      )}
      {preview && (
        <FileViewer
          open
          fileUrl={documentUrl(preview)}
          fileName={`Pay-in request ${value(preview, 'RequestID')} document`}
          onClose={() => setPreview(null)}
        />
      )}
    </section>
  );
}
