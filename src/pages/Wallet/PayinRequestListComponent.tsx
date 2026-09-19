import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { WalletService } from '../../services/WalletService';
import { MasterDataService } from '../../services/MasterDataService';
import FileViewer from '../../components/FileViewer';
import { ErrorState, Loading } from '../../components/Status';
import { exportToExcel } from '../../core/exportToExcel';
import {
  cell,
  columns,
  documentUrl,
  initialFilters,
  PAGE_SIZE,
  PAYIN_STATUS,
  payinPage,
  records,
  searchBody,
  statusOptions,
  value,
  type PayinRow,
} from './payinRequests';
import '../Masters/MasterDataCrudPage.css';
import './PayinRequestList.css';

export default function PayinRequestListComponent() {
  const [draft, setDraft] = useState(initialFilters);
  const [filters, setFilters] = useState(draft);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<PayinRow | null>(null);
  const actionLock = useRef(false);
  const exportController = useRef<AbortController | null>(null);
  useEffect(() => () => exportController.current?.abort(), []);

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
  const list = useQuery({
    queryKey: ['wallet-payin-requests', filters, page],
    queryFn: async ({ signal }) =>
      payinPage(await WalletService.searchPayinRequests(searchBody(filters, page), signal)),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const rows = list.isError ? [] : (list.data?.rows ?? []);
  const total = list.data?.total ?? null;
  const pages = total === null ? null : Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectable = rows
    .filter((row) => Number(value(row, 'Status')) === PAYIN_STATUS.pending)
    .map((row) => Number(value(row, 'RequestID')))
    .filter((id) => Number.isSafeInteger(id) && id > 0);
  const selectedIds = selected.filter((id) => selectable.includes(id));
  const locked = busy || exporting || list.isFetching;
  const availableModes = records(modes.data?.Result).filter(
    (row) => !draft.channel || Number(value(row, 'PaymentChanelID')) === Number(draft.channel),
  );

  function search(event: FormEvent) {
    event.preventDefault();
    if (locked) return;
    if (!draft.from || !draft.to || draft.from > draft.to) {
      setError(new Error('Select valid dates. From date must be on or before to date.'));
      return;
    }
    setError(undefined);
    setMessage('');
    setSelected([]);
    setPage(1);
    if (page === 1 && JSON.stringify(filters) === JSON.stringify(draft)) void list.refetch();
    else setFilters({ ...draft });
  }

  async function decide(status: typeof PAYIN_STATUS.approved | typeof PAYIN_STATUS.rejected) {
    if (actionLock.current || locked || !selectedIds.length) return;
    const rejected = status === PAYIN_STATUS.rejected;
    if (rejected && !reason.trim()) {
      setReasonError('Rejected reason is required.');
      return;
    }
    actionLock.current = true;
    setBusy(true);
    setError(undefined);
    setMessage('');
    const failures: string[] = [];
    let succeeded = 0;
    try {
      for (const RequestID of selectedIds) {
        try {
          await WalletService.approveRejectPayinRequest({
            RequestID,
            Status: status,
            RejectedReason: rejected ? reason.trim() : null,
          });
          succeeded++;
        } catch (caught) {
          failures.push(
            `#${RequestID}: ${caught instanceof Error ? caught.message : 'Request failed'}`,
          );
        }
      }
      setSelected([]);
      setRejectOpen(false);
      setReason('');
      if (succeeded)
        setMessage(
          `${succeeded} request${succeeded === 1 ? '' : 's'} ${rejected ? 'rejected' : 'approved'}.`,
        );
      if (failures.length) setError(new Error(failures.join('\n')));
      const refreshed = await list.refetch();
      if (refreshed.data && !refreshed.data.rows.length && page > 1) setPage(page - 1);
    } finally {
      actionLock.current = false;
      setBusy(false);
    }
  }

  async function exportResults() {
    if (locked || exportController.current || !rows.length) return;
    const controller = new AbortController();
    exportController.current = controller;
    setExporting(true);
    setError(undefined);
    try {
      const all: PayinRow[] = [];
      const seen = new Set<number>();
      for (let current = 1; ; current++) {
        const result = payinPage(
          await WalletService.searchPayinRequests(searchBody(filters, current), controller.signal),
        );
        for (const row of result.rows) {
          const id = Number(value(row, 'RequestID'));
          if (seen.has(id))
            throw new Error(
              'The results changed during export. Search again and retry the export.',
            );
          seen.add(id);
          all.push(row);
        }
        if (result.rows.length < PAGE_SIZE || (result.total !== null && all.length >= result.total))
          break;
      }
      exportToExcel(
        `Payin requests ${filters.from} to ${filters.to}`,
        columns.map(([, label]) => label),
        all.map((row) =>
          Object.fromEntries(columns.map(([key, label]) => [label, cell(row, key)])),
        ),
      );
    } catch (caught) {
      if (!controller.signal.aborted) setError(caught);
    } finally {
      exportController.current = null;
      setExporting(false);
    }
  }

  return (
    <section className="master-data-page payin-request-page">
      <div className="page-heading">
        <div>
          <h1>Pay-in requests</h1>
          <p>Review payment requests for the selected dates.</p>
        </div>
      </div>
      <form className="card master-form" aria-label="Search pay-in requests" onSubmit={search}>
        <fieldset disabled={busy || exporting} className="payin-search-fields">
          <div className="payin-search-grid">
            <label className="master-field">
              From date
              <input
                type="date"
                required
                max={draft.to || undefined}
                value={draft.from}
                onChange={(event) => setDraft({ ...draft, from: event.target.value })}
              />
            </label>
            <label className="master-field">
              To date
              <input
                type="date"
                required
                min={draft.from || undefined}
                value={draft.to}
                onChange={(event) => setDraft({ ...draft, to: event.target.value })}
              />
            </label>
            <label className="master-field">
              Status
              <select
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value })}
              >
                <option value="">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="master-field">
              Payment channel
              <select
                disabled={!channels.isSuccess}
                value={draft.channel}
                onChange={(event) => setDraft({ ...draft, channel: event.target.value, mode: '' })}
              >
                <option value="">All channels</option>
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
                disabled={!modes.isSuccess}
                value={draft.mode}
                onChange={(event) => setDraft({ ...draft, mode: event.target.value })}
              >
                <option value="">All modes</option>
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
          </div>
          <button type="submit" disabled={locked}>
            Search
          </button>
        </fieldset>
      </form>
      {channels.isError && (
        <ErrorState error={channels.error} retry={() => void channels.refetch()} />
      )}
      {modes.isError && <ErrorState error={modes.error} retry={() => void modes.refetch()} />}
      {error != null && <ErrorState error={error} />}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <div className="payin-actions">
        <button
          type="button"
          className="payin-approve"
          disabled={locked || !selectedIds.length}
          onClick={() => void decide(PAYIN_STATUS.approved)}
        >
          <CheckCircleOutlineIcon fontSize="small" /> Approve
        </button>
        <button
          type="button"
          className="payin-reject"
          disabled={locked || !selectedIds.length}
          onClick={() => {
            setReason('');
            setReasonError('');
            setRejectOpen(true);
          }}
        >
          <HighlightOffIcon fontSize="small" /> Reject
        </button>
        <span>{selectedIds.length} selected on this page</span>
        <button
          type="button"
          className="secondary payin-export"
          disabled={locked || !rows.length || list.isError}
          onClick={() => void exportResults()}
        >
          <FileDownloadOutlinedIcon fontSize="small" />
          {exporting ? 'Exporting…' : 'Export to Excel'}
        </button>
      </div>
      {busy && <p role="status">Processing selected requests…</p>}
      {list.isFetching && <Loading />}
      {list.isError && (
        <ErrorState
          error={list.error}
          retry={() => {
            setSelected([]);
            void list.refetch();
          }}
        />
      )}
      <div className="master-table-wrap">
        <table aria-label="Pay-in requests" aria-busy={locked}>
          <thead>
            <tr>
              <th>
                <Checkbox
                  size="small"
                  slotProps={{
                    input: { 'aria-label': 'Select all pending requests on this page' },
                  }}
                  disabled={locked || !selectable.length}
                  checked={selectable.length > 0 && selectedIds.length === selectable.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < selectable.length}
                  onChange={(_, checked) => setSelected(checked ? selectable : [])}
                />
              </th>
              {columns.map(([key, label]) => (
                <th key={key}>{label}</th>
              ))}
              <th>Document</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = Number(value(row, 'RequestID'));
              return (
                <tr key={id} className={selectedIds.includes(id) ? 'payin-selected' : undefined}>
                  <td>
                    <Checkbox
                      size="small"
                      slotProps={{ input: { 'aria-label': `Select request ${id}` } }}
                      disabled={locked || !selectable.includes(id)}
                      checked={selectedIds.includes(id)}
                      onChange={(_, checked) =>
                        setSelected((current) =>
                          checked ? [...current, id] : current.filter((item) => item !== id),
                        )
                      }
                    />
                  </td>
                  {columns.map(([key]) => (
                    <td key={key}>
                      {key === 'StatusName' ? (
                        <span
                          className={`payin-status payin-status-${Number(value(row, 'Status'))}`}
                        >
                          {String(cell(row, key))}
                        </span>
                      ) : (
                        String(cell(row, key))
                      )}
                    </td>
                  ))}
                  <td>
                    <button
                      type="button"
                      className="master-action view"
                      disabled={!documentUrl(row)}
                      onClick={() => setPreview(row)}
                    >
                      <VisibilityOutlinedIcon fontSize="small" /> View document
                    </button>
                  </td>
                </tr>
              );
            })}
            {!rows.length && !list.isFetching && !list.isError && (
              <tr>
                <td colSpan={columns.length + 2}>
                  No requests found for the selected dates and filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <nav aria-label="Pay-in request pagination" className="payin-pagination">
        <span>
          {total === null ? `${rows.length} records on this page` : `${total} records`} · Up to{' '}
          {PAGE_SIZE} per page
        </span>
        <button
          type="button"
          className="secondary"
          disabled={locked || page === 1}
          onClick={() => {
            setSelected([]);
            setPage(page - 1);
          }}
        >
          Previous
        </button>
        <span>
          Page {page}
          {pages !== null ? ` of ${pages}` : ''}
        </span>
        <button
          type="button"
          className="secondary"
          disabled={
            locked || list.isError || (pages !== null ? page >= pages : rows.length < PAGE_SIZE)
          }
          onClick={() => {
            setSelected([]);
            setPage(page + 1);
          }}
        >
          Next
        </button>
      </nav>
      <Dialog
        open={rejectOpen}
        onClose={() => {
          if (!busy) setRejectOpen(false);
        }}
        fullWidth
        maxWidth="sm"
        aria-labelledby="reject-payin-title"
      >
        <DialogTitle id="reject-payin-title">Reject selected requests</DialogTitle>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void decide(PAYIN_STATUS.rejected);
          }}
        >
          <DialogContent>
            <p>
              Provide a reason for rejecting {selectedIds.length} request
              {selectedIds.length === 1 ? '' : 's'}.
            </p>
            <label className="master-field">
              Rejected reason
              <textarea
                autoFocus
                required
                rows={4}
                value={reason}
                disabled={busy}
                aria-invalid={!!reasonError}
                aria-describedby={reasonError ? 'payin-reason-error' : undefined}
                onChange={(event) => {
                  setReason(event.target.value);
                  setReasonError('');
                }}
              />
            </label>
            {reasonError && (
              <p id="payin-reason-error" role="alert">
                {reasonError}
              </p>
            )}
          </DialogContent>
          <DialogActions>
            <Button disabled={busy} onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" color="error" disabled={locked || !selectedIds.length}>
              {busy ? 'Rejecting…' : 'Confirm rejection'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {preview && (
        <FileViewer
          open
          fileUrl={documentUrl(preview)}
          fileName={`Pay-in request ${String(value(preview, 'RequestID'))} document`}
          contentType={String(value(preview, 'MediaContentType') || '')}
          onClose={() => setPreview(null)}
        />
      )}
    </section>
  );
}
