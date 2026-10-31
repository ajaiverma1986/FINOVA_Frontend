import { useRef, useState, type FormEvent } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../core/auth';
import { request } from '../../core/api';
import { ErrorState, Loading } from '../../components/Status';
import { MasterDataService } from '../../services/MasterDataService';
import {
  TransactionService,
  type NewTransactionRequest,
  type UpdateTransactionStatusRequest,
} from '../../services/TransactionService';
import TransactionReceiptDialog, { type TransactionReceiptData } from './TransactionReceiptDialog';
import { records, value, type PayinRow } from '../Wallet/payinRequests';
import '../Masters/MasterDataCrudPage.css';
import './DummyServiceTransactions.css';

function transactionId(response: unknown): number | null {
  const root =
    response !== null && typeof response === 'object' && !Array.isArray(response)
      ? (response as Record<string, unknown>)
      : {};
  const candidate =
    root.Result !== undefined && root.Result !== null
      ? root.Result
      : undefined;

  const directId =
    typeof candidate === 'number'
      ? candidate
      : typeof candidate === 'string'
        ? Number(candidate)
        : typeof candidate === 'object' && candidate !== null && !Array.isArray(candidate)
          ? (() => {
              const result = candidate as Record<string, unknown>;
              const nested =
                Object.entries(result).find(([key]) => key.toLowerCase() === 'transactionid')?.[1] ??
                Object.entries(result).find(([key]) => key.toLowerCase() === 'id')?.[1];
              return Number(nested);
            })()
          : NaN;

  const fallbackId =
    typeof root.TransactionId === 'number'
      ? root.TransactionId
      : typeof root.TransactionId === 'string'
        ? Number(root.TransactionId)
        : NaN;

  const id = Number.isFinite(directId) ? directId : fallbackId;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function idFromProfile(profile: PayinRow, ...keys: string[]): number | null {
  const key = Object.keys(profile).find((name) =>
    keys.some((candidate) => candidate.toLowerCase() === name.toLowerCase()),
  );
  const id = Number(key ? profile[key] : NaN);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export default function DummyServiceTransactionsComponent() {
  const { session } = useAuth();
  const profile = useQuery({
    queryKey: ['profile', session?.username, false],
    enabled: !!session,
    queryFn: ({ signal }) =>
      request<PayinRow>(
        '/User/GetUserMasterDetailsforConfig?UserName=' + encodeURIComponent(session!.username),
        { signal },
      ),
    retry: false,
  });

  if (!session) return <ErrorState error={new Error('Sign in to create a transaction.')} />;
  if (profile.isPending) return <Loading />;
  if (profile.isError)
    return <ErrorState error={profile.error} retry={() => void profile.refetch()} />;

  const details = profile.data.Result ?? {};
  const userId = idFromProfile(details, 'UserMasterId', 'UserId');
  if (!userId)
    return <ErrorState error={new Error('Your profile does not contain a valid user ID.')} />;

  return <DummyServiceTransactionForm userId={userId} />;
}

function DummyServiceTransactionForm({ userId }: { userId: number }) {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const createLock = useRef(false);
  const updateLock = useRef(false);
  const [error, setError] = useState<unknown>();
  const [creation, setCreation] = useState<unknown>();
  const [creationRequest, setCreationRequest] = useState<NewTransactionRequest | null>(null);
  const [transactionKey, setTransactionKey] = useState<number | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [receipt, setReceipt] = useState<TransactionReceiptData | null>(null);

  const services = useQuery({
    queryKey: ['transaction-services'],
    queryFn: ({ signal }) => MasterDataService.getAllServices(signal),
    retry: false,
  });
  const agencies = useQuery({
    queryKey: ['transaction-agencies'],
    queryFn: ({ signal }) => MasterDataService.getActiveAgencies(signal),
    retry: false,
  });

  async function createTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createLock.current) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (key: string) => String(data.get(key) ?? '').trim();
    const amount = Number(text('Amount'));
    const fee = Number(text('TxnFee'));
    const margin = Number(text('Margin'));
    const requestBody: NewTransactionRequest = {
      OrganizationId: 1,
      UserMasterId: userId,
      ServiceId: Number(text('ServiceId')),
      AgencyId: Number(text('AgencyId')),
      PartnerTxnId: text('PartnerTxnId') || undefined,
      TxnType: 'D',
      Amount: amount,
      TxnFee: fee,
      Margin: margin,
      TxnPlateform: 'W',
    };

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isFinite(fee) ||
      fee < 0 ||
      !Number.isFinite(margin) ||
      margin < 0
    ) {
      setError(new Error('Enter a positive amount and non-negative fee and margin.'));
      return;
    }

    createLock.current = true;
    setCreating(true);
    setError(undefined);
    try {
      const response = await TransactionService.createNewTransaction(requestBody);
      const id = transactionId(response);
      if (!id)
        throw new Error(
          'The transaction was created, but the API response did not include a TransactionId.',
        );
      setCreation(response);
      setCreationRequest(requestBody);
      setTransactionKey(id);
      setSelectedStatus('');
      setResultOpen(true);
    } catch (caught) {
      setError(caught);
    } finally {
      createLock.current = false;
      setCreating(false);
    }
  }

  async function updateTransactionStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (updateLock.current || !transactionKey || !selectedStatus) return;
    const status = Number(selectedStatus);
    const body: UpdateTransactionStatusRequest = {
      TransactionId: transactionKey,
      RelatedReference: null,
      RefNo1: null,
      RefNo2: null,
      RefNo3: null,
      RefNo4: null,
      RefNo5: null,
      RefNo6: null,
      RefNo7: null,
      RefNo8: null,
      RefNo9: null,
      Status: status,
    };

    updateLock.current = true;
    setUpdating(true);
    setError(undefined);
    try {
      const response = await TransactionService.updateTransactionStatus(body);
      setResultOpen(false);
      setReceipt({
        created: creation,
        updated: response,
        request: creationRequest ?? {},
        status,
      });
    } catch (caught) {
      setError(caught);
    } finally {
      updateLock.current = false;
      setUpdating(false);
    }
  }

  const lookupQueries = [services, agencies];
  const lookupsReady = lookupQueries.every((query) => query.isSuccess);

  return (
    <section className="master-data-page dummy-service-transactions">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Transactions</p>
          <h1>Dummy service transaction</h1>
          <p>Create a test transaction and simulate its final status.</p>
        </div>
      </div>
      {lookupQueries.map((query, index) =>
        query.isError ? (
          <ErrorState key={index} error={query.error} retry={() => void query.refetch()} />
        ) : null,
      )}
      {error != null && <ErrorState error={error} />}
      <form
        className="card master-form"
        aria-label="Create transaction"
        onSubmit={createTransaction}
      >
        <div className="master-form-grid">
          <label className="master-field">
            Agency
            <select
              name="AgencyId"
              required
              defaultValue=""
              disabled={!agencies.isSuccess || creating}
            >
              <option value="">Select agency</option>
              {records(agencies.data?.Result).map((row) => {
                const id = value(row, 'AgencyID') ?? value(row, 'AgencyId');
                if (!id) return null;
                return (
                  <option key={String(id)} value={String(id)}>
                    {String(value(row, 'AgencyName') ?? id)}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="master-field">
            Service
            <select
              name="ServiceId"
              required
              defaultValue=""
              disabled={!services.isSuccess || creating}
            >
              <option value="">Select service</option>
              {records(services.data?.Result).map((row) => {
                const id = value(row, 'ServiceID') ?? value(row, 'ServiceId');
                if (!id) return null;
                return (
                  <option key={String(id)} value={String(id)}>
                    {String(value(row, 'ServiceName') ?? id)}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="master-field">
            Amount
            <input name="Amount" type="number" min="0.01" step="0.01" required />
          </label>
          <label className="master-field">
            Transaction fee
            <input name="TxnFee" type="number" min="0" step="0.01" required />
          </label>
          <label className="master-field">
            Margin
            <input name="Margin" type="number" min="0" step="0.01" required />
          </label>
          <label className="master-field">
            Partner transaction ID
            <input name="PartnerTxnId" type="text" />
          </label>
        </div>
        <Button
          className="transaction-submit-button"
          type="submit"
          variant="contained"
          disabled={creating || !lookupsReady}
        >
          {creating ? 'Processing…' : 'Do Transaction'}
        </Button>
      </form>

      <Dialog
        open={resultOpen}
        fullWidth
        maxWidth="xs"
        aria-labelledby="transaction-result-title"
        onClose={() => undefined}
      >
        <DialogTitle id="transaction-result-title">Select transaction result</DialogTitle>
        <form onSubmit={updateTransactionStatus}>
          <DialogContent>
            {error != null && <ErrorState error={error} />}
            <FormControl>
              <FormLabel id="transaction-status-label">Simulated result</FormLabel>
              <RadioGroup
                aria-labelledby="transaction-status-label"
                name="transaction-status"
                value={selectedStatus}
                onChange={(event) => {
                  setSelectedStatus(event.target.value);
                  setError(undefined);
                }}
              >
                <FormControlLabel
                  value="2"
                  control={<Radio />}
                  label="Success"
                  disabled={updating}
                />
                <FormControlLabel
                  value="3"
                  control={<Radio />}
                  label="Failure"
                  disabled={updating}
                />
              </RadioGroup>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button type="submit" variant="contained" disabled={!selectedStatus || updating}>
              {updating ? 'Submitting…' : 'Submit'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <TransactionReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
    </section>
  );
}
