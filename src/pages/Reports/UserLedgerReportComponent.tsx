import { useCallback, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ErrorState, Loading } from '../../components/Status';
import { ReportService, type UserLedgerReportRequest } from '../../services/ReportService';
import { exportToExcel } from '../../core/exportToExcel';
import LedgerUserFilters from './LedgerUserFilters';
import { today } from '../Wallet/payinRequests';
import '../Masters/MasterDataCrudPage.css';
import '../Wallet/PayinRequestList.css';
import './TransactionReport.css';
import './UserLedgerReport.css';

function normalizeRows(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  if (result && typeof result === 'object') {
    const value = result as Record<string, unknown>;
    const candidates = [value.Data, value.Records, value.Result];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as Record<string, unknown>[];
    }
  }
  return [];
}

const columnKey = (column: string) => column.replace(/_/g, '').toLowerCase();
const hiddenColumns = new Set(['usermasterid', 'ledgertypeid']);
const labels: Record<string, string> = {
  ledgerid: 'Ledger ID',
  username: 'User name',
  ledgerdate: 'Ledger date',
  ledgertypename: 'Ledger type',
  naration: 'Narration',
  narration: 'Narration',
  dbcr: 'Dr / Cr',
  debitamount: 'Debit amount',
  creditamount: 'Credit amount',
};
const columnLabel = (column: string) =>
  labels[columnKey(column)] ?? column.replace(/([a-z])([A-Z])/g, '$1 $2');
const isAmount = (column: string) => /amount|balance/.test(columnKey(column));
const amountFormat = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 20,
});

function displayValue(column: string, value: unknown) {
  if (columnKey(column) === 'dbcr') return Number(value) === 1 ? 'Credit' : 'Debit';
  if (value === null || value === undefined || value === '') return '?';
  if (isAmount(column) && Number.isFinite(Number(value))) return amountFormat.format(Number(value));
  if (columnKey(column).endsWith('date')) {
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:T| )(\d{2}:\d{2}:\d{2})/);
    if (match) return `${match[3]}/${match[2]}/${match[1]} ${match[4]}`;
  }
  return String(value);
}

export default function UserLedgerReportComponent() {
  const [draft, setDraft] = useState(() => ({
    FromDate: today(),
    ToDate: today(),
    UserMasterId: '',
  }));
  const [filters, setFilters] = useState(draft);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [error, setError] = useState<unknown>();

  const body: UserLedgerReportRequest = {
    FromDate: filters.FromDate ? `${filters.FromDate}T00:00:00` : null,
    ToDate: filters.ToDate ? `${filters.ToDate}T23:59:59.999` : null,
    UserMasterId: filters.UserMasterId ? Number(filters.UserMasterId) : null,
  };

  const ledger = useQuery({
    queryKey: ['user-ledger-report', body],
    enabled: !!filters.FromDate && !!filters.ToDate,
    queryFn: async ({ signal }) => {
      const response = await ReportService.getUserLedgerReport(body, signal);
      const result = response?.Result ?? response ?? [];
      const rows = normalizeRows(result);
      if (rows.length > 0) return rows;
      return normalizeRows(
        (result && typeof result === 'object' ? (result as Record<string, unknown>).Data : []) ??
          [],
      );
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const rows = ledger.data ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(startIndex, startIndex + pageSize);
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).filter(
    (column) => !hiddenColumns.has(columnKey(column)),
  );

  const totals = rows.reduce<{ debit: number; credit: number }>(
    (sum, row) => {
      for (const [key, value] of Object.entries(row)) {
        const amount = Number(value ?? 0);
        if (!Number.isFinite(amount)) continue;
        if (columnKey(key) === 'debitamount') sum.debit += amount;
        if (columnKey(key) === 'creditamount') sum.credit += amount;
      }
      return sum;
    },
    { debit: 0, credit: 0 },
  );
  const summaryItems = [
    { label: 'Total debit', amount: totals.debit },
    { label: 'Total credit', amount: totals.credit },
    { label: 'Difference', amount: totals.credit - totals.debit },
  ];

  function search(event: FormEvent) {
    event.preventDefault();
    if (!draft.FromDate || !draft.ToDate || draft.FromDate > draft.ToDate) {
      setError(new Error('From date must be on or before to date.'));
      return;
    }
    setError(undefined);
    setPage(1);
    setFilters({
      FromDate: draft.FromDate,
      ToDate: draft.ToDate,
      UserMasterId: draft.UserMasterId.trim(),
    });
  }

  const changeAgent = useCallback((id: string) => {
    setDraft((current) => ({ ...current, UserMasterId: id }));
  }, []);

  function change(key: 'FromDate' | 'ToDate', next: string) {
    setDraft((current) => ({ ...current, [key]: next }));
  }

  return (
    <section className="master-data-page payin-request-page transaction-report-page user-ledger-page">
      <div className="page-heading">
        <div>
          <h1>User Ledger Report</h1>
          <p>Search user ledger movements for the selected date range.</p>
        </div>
      </div>

      <form className="card master-form" aria-label="Search user ledger" onSubmit={search}>
        <div className="payin-search-grid">
          <label className="master-field">
            From date
            <input
              required
              type="date"
              value={draft.FromDate}
              max={draft.ToDate}
              onChange={(event) => change('FromDate', event.target.value)}
            />
          </label>

          <label className="master-field">
            To date
            <input
              required
              type="date"
              value={draft.ToDate}
              min={draft.FromDate}
              onChange={(event) => change('ToDate', event.target.value)}
            />
          </label>

          <LedgerUserFilters onChange={changeAgent} />
        </div>

        <div className="button-row">
          <button type="submit" className="primary-btn">
            Search
          </button>
        </div>
      </form>

      {error ? <ErrorState error={error} /> : null}
      {ledger.isLoading ? <Loading /> : null}
      {ledger.isError ? (
        <ErrorState error={new Error('The server returned an unexpected user ledger report.')} />
      ) : null}

      {ledger.isSuccess ? (
        <dl className="ledger-summary" aria-label="Ledger totals">
          {summaryItems.map(({ label, amount }) => (
            <div className="card ledger-summary-item" key={label}>
              <dt>{label}</dt>
              <dd>{amountFormat.format(Number(amount.toPrecision(15)))}</dd>
              {label === 'Difference' ? <small>Total credit &minus; total debit</small> : null}
            </div>
          ))}
        </dl>
      ) : null}

      {!ledger.isLoading && !ledger.isError && rows.length > 0 ? (
        <div className="card ledger-results">
          <div className="ledger-results-toolbar">
            <div>
              <h2>Ledger entries</h2>
              <span>
                {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                exportToExcel(
                  'User ledger report',
                  columns.map(columnLabel),
                  rows.map((row) =>
                    Object.fromEntries(
                      columns.map((column) => [
                        columnLabel(column),
                        columnKey(column) === 'dbcr'
                          ? displayValue(column, row[column])
                          : (row[column] ?? ''),
                      ]),
                    ),
                  ),
                )
              }
            >
              Export to Excel
            </button>
          </div>
          <div
            className="ledger-table-scroll"
            role="region"
            aria-label="Ledger entries"
            tabIndex={0}
          >
            <table aria-label="User ledger report" aria-busy={ledger.isFetching}>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className={isAmount(column) ? 'ledger-amount' : undefined}
                    >
                      {columnLabel(column)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((column) => (
                      <td
                        key={`${rowIndex}-${column}`}
                        className={
                          isAmount(column)
                            ? 'ledger-amount'
                            : ['naration', 'narration'].includes(columnKey(column))
                              ? 'ledger-narration'
                              : undefined
                        }
                      >
                        {columnKey(column) === 'dbcr' ? (
                          <span
                            className={`ledger-direction ${Number(row[column]) === 1 ? 'ledger-credit' : 'ledger-debit'}`}
                          >
                            {displayValue(column, row[column])}
                          </span>
                        ) : columnKey(column) === 'ledgertypename' ? (
                          <span className="ledger-type">{displayValue(column, row[column])}</span>
                        ) : (
                          displayValue(column, row[column])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav className="ledger-pagination" aria-label="Ledger pagination">
            <label>
              Rows per page
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <span aria-live="polite">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, rows.length)} of{' '}
              {rows.length} entries
            </span>
            <div className="ledger-page-buttons">
              <button
                type="button"
                className="secondary"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="secondary"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </nav>
        </div>
      ) : null}

      {!ledger.isLoading && !ledger.isError && rows.length === 0 ? (
        <div className="card empty-state">No ledger entries found for the selected filters.</div>
      ) : null}
    </section>
  );
}
