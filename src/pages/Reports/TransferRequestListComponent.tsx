import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  value,
  type PayinRow,
} from '../Wallet/payinRequests';
import '../Masters/MasterDataCrudPage.css';
import '../Wallet/PayinRequestList.css';

export default function TransferRequestListComponent() {
  const [draft, setDraft] = useState(() => ({ ...initialFilters(), status: String(PAYIN_STATUS.approved) }));
  const [filters, setFilters] = useState(draft);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<unknown>();
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<PayinRow | null>(null);
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
  const locked = exporting || list.isFetching;
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
    setPage(1);
    if (page === 1 && JSON.stringify(filters) === JSON.stringify(draft)) void list.refetch();
    else setFilters({ ...draft });
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
        `Transfer Report ${filters.from} to ${filters.to}`,
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
          <h1>Transfer Report</h1>
          <p>View approved transfers for the selected dates.</p>
        </div>
      </div>
      <form className="card master-form" aria-label="Search transfer requests" onSubmit={search}>
        <fieldset disabled={exporting} className="payin-search-fields">
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
      <div className="payin-actions">
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
      {list.isFetching && <Loading />}
      {list.isError && (
        <ErrorState
          error={list.error}
          retry={() => {
                    void list.refetch();
          }}
        />
      )}
      <div className="master-table-wrap">
        <table aria-label="Transfer Report" aria-busy={locked}>
          <thead>
            <tr>
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
                <tr key={id}>
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
                     data-grid-icon="true" aria-label="View document" title="View document">
                      <VisibilityOutlinedIcon fontSize="small" /></button>
                  </td>
                </tr>
              );
            })}
            {!rows.length && !list.isFetching && !list.isError && (
              <tr>
                <td colSpan={columns.length + 1}>
                  No requests found for the selected dates and filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <nav aria-label="Transfer request pagination" className="payin-pagination">
        <span>
          {total === null ? `${rows.length} records on this page` : `${total} records`} · Up to{' '}
          {PAGE_SIZE} per page
        </span>
        <button
          type="button"
          className="secondary"
          disabled={locked || page === 1}
          onClick={() => {
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
                    setPage(page + 1);
          }}
        >
          Next
        </button>
      </nav>
      {preview && (
        <FileViewer
          open
          fileUrl={documentUrl(preview)}
          fileName={`Transfer request ${String(value(preview, 'RequestID'))} document`}
          contentType={String(value(preview, 'MediaContentType') || '')}
          onClose={() => setPreview(null)}
        />
      )}
    </section>
  );
}
