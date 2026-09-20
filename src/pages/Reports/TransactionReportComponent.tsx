import { useState, type FormEvent } from 'react';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useQuery } from '@tanstack/react-query';
import { ReportService, type TransactionReportRequest } from '../../services/ReportService';
import { ErrorState, Loading } from '../../components/Status';
import { exportToExcel } from '../../core/exportToExcel';
import { OrgMgrService } from '../../services/OrgMgrService';
import { MasterDataService } from '../../services/MasterDataService';
import { today, value, records } from '../Wallet/payinRequests';
import { z } from 'zod';
import '../Masters/MasterDataCrudPage.css';
import '../Wallet/PayinRequestList.css';
import './TransactionReport.css';

const fields = [
  ['UserName', 'User name', 'text'],
  ['TransactionCode', 'Transaction code', 'text'],
  ['RefNo', 'Reference number', 'text'],
  ['PartnerTxnId', 'Partner transaction ID', 'text'],
  ['OrganizationId', 'Organization', 'number'],
  ['TransactionId', 'Transaction ID', 'number'],
  ['AgencyId', 'Agency', 'number'],
  ['ServiceId', 'Service', 'number'],
  ['Status', 'Status', 'number'],
] as const;
const columns = [
  ['TransactionId', 'Transaction ID'],
  ['TransactionCode', 'Transaction code'],
  ['UserName', 'User name'],
  ['ServiceName', 'Service'],
  ['AgencyName', 'Agency'],
  ['BankTxnDatetime', 'Transaction date'],
  ['Amount', 'Amount'],
  ['TxnFee', 'Fee'],
  ['MarginComm', 'Commission'],
  ['StatusName', 'Status'],
  ['RefNo', 'Reference'],
  ['PartnerTxnId', 'Partner transaction ID'],
  ['TxnType', 'Type'],
  ['TxnPlateform', 'Platform'],
  ['Description', 'Description'],
  ['FailureReason', 'Failure reason'],
] as const;
const schema = z.object({
  Records: z.array(z.record(z.string(), z.unknown())),
  Paging: z.object({ TotalRecords: z.number(), TotalPages: z.number(), HasNextPage: z.boolean() }),
});
const initial = (): Record<string, string> => ({
  FromDate: today(),
  ToDate: today(),
  PageSize: '20',
  SortColumn: 'TransactionId',
  SortDirection: 'DESC',
});

export default function TransactionReportComponent() {
  const [draft, setDraft] = useState(initial);
  const [filters, setFilters] = useState(draft);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<unknown>();
  const organizations = useQuery({
    queryKey: ['report-organizations'],
    queryFn: ({ signal }) => OrgMgrService.getActiveOrganizations(signal),
    retry: false,
  });
  const services = useQuery({
    queryKey: ['report-services'],
    queryFn: ({ signal }) => MasterDataService.getAllServices(signal),
    retry: false,
  });
  const agencies = useQuery({
    queryKey: ['report-agencies'],
    queryFn: ({ signal }) => MasterDataService.getActiveAgencies(signal),
    retry: false,
  });
  const lookupOptions: Record<string, { id: string; name: string }[]> = {
    OrganizationId: records(organizations.data?.Result).map((row) => ({
      id: String(value(row, 'OrganizationID')),
      name: String(value(row, 'OrganizationName') ?? ''),
    })),
    ServiceId: records(services.data?.Result).map((row) => ({
      id: String(value(row, 'ServiceID')),
      name: String(value(row, 'ServiceName') ?? ''),
    })),
    AgencyId: records(agencies.data?.Result).map((row) => ({
      id: String(value(row, 'AgencyID')),
      name: String(value(row, 'AgencyName') ?? ''),
    })),
    Status: [
      { id: '1', name: 'Pending' },
      { id: '2', name: 'Success' },
      { id: '3', name: 'Failed' },
      { id: '4', name: 'Canceled' },
    ],
  };
  const lookupQueries = { OrganizationId: organizations, ServiceId: services, AgencyId: agencies };
  const body: TransactionReportRequest = {
    ...Object.fromEntries(
      fields.map(([key, , type]) => [
        key,
        filters[key]?.trim()
          ? type === 'number'
            ? Number(filters[key])
            : filters[key].trim()
          : null,
      ]),
    ),
    FromDate: `${filters.FromDate}T00:00:00`,
    ToDate: `${filters.ToDate}T23:59:59.999`,
    PageNumber: page,
    PageSize: Number(filters.PageSize),
    SortColumn: filters.SortColumn,
    SortDirection: filters.SortDirection,
  };
  const list = useQuery({
    queryKey: ['transaction-details-report', body],
    queryFn: async ({ signal }) => {
      const response = await ReportService.transactionDetailsReport(body, signal);
      const parsed = schema.safeParse(response.Result);
      if (!parsed.success) throw new Error('The server returned an unexpected transaction report.');
      return parsed.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
  const rows = list.isError ? [] : (list.data?.Records ?? []);
  function search(event: FormEvent) {
    event.preventDefault();
    if (!draft.FromDate || !draft.ToDate || draft.FromDate > draft.ToDate) {
      setError(new Error('From date must be on or before to date.'));
      return;
    }
    setError(undefined);
    setPage(1);
    if (page === 1 && JSON.stringify(filters) === JSON.stringify(draft)) void list.refetch();
    else setFilters({ ...draft });
  }
  const change = (key: string, next: string) =>
    setDraft((current) => ({ ...current, [key]: next }));
  return (
    <section className="master-data-page payin-request-page transaction-report-page">
      <div className="page-heading">
        <div>
          <h1>Transaction Report</h1>
          <p>Search transactions for the selected dates.</p>
        </div>
      </div>
      <form className="card master-form" aria-label="Search transactions" onSubmit={search}>
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
          {fields.map(([key, label, type]) => (
            <label key={key} className="master-field">
              {label}
              {lookupOptions[key] ? (
                <select
                  value={draft[key] ?? ''}
                  disabled={
                    key in lookupQueries &&
                    !lookupQueries[key as keyof typeof lookupQueries].isSuccess
                  }
                  onChange={(event) => change(key, event.target.value)}
                >
                  <option value="">All {label.toLowerCase()}</option>
                  {lookupOptions[key]
                    .filter((option) => Number(option.id) > 0)
                    .map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  type={type}
                  min={type === 'number' ? 0 : undefined}
                  step={key.endsWith('Amount') ? '0.01' : type === 'number' ? '1' : undefined}
                  value={draft[key] ?? ''}
                  onChange={(event) => change(key, event.target.value)}
                />
              )}
            </label>
          ))}
        </div>
        <button type="submit" disabled={list.isFetching}>
          Search
        </button>
      </form>
      {[organizations, services, agencies].map((query, index) =>
        query.isError ? (
          <ErrorState key={index} error={query.error} retry={() => void query.refetch()} />
        ) : null,
      )}
      {error != null && <ErrorState error={error} />}
      <div className="payin-actions">
        <button
          type="button"
          className="secondary payin-export"
          disabled={!rows.length || list.isFetching}
          onClick={() =>
            exportToExcel(
              `Transaction report page ${page}`,
              columns.map(([, label]) => label),
              rows.map((row) =>
                Object.fromEntries(
                  columns.map(([key, label]) => [label, String(value(row, key) ?? '')]),
                ),
              ),
            )
          }
        >
          <FileDownloadOutlinedIcon fontSize="small" /> Export current page
        </button>
      </div>
      {list.isFetching && <Loading />}
      {list.isError && <ErrorState error={list.error} retry={() => void list.refetch()} />}
      <div className="master-table-wrap">
        <table aria-label="Transaction report" aria-busy={list.isFetching}>
          <thead>
            <tr>
              {columns.map(([key, label]) => (
                <th key={key}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(value(row, 'TransactionId'))}>
                {columns.map(([key]) => (
                  <td key={key}>{String(value(row, key) ?? '')}</td>
                ))}
              </tr>
            ))}
            {!rows.length && !list.isFetching && !list.isError && (
              <tr>
                <td colSpan={columns.length}>No transactions found for the selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <nav className="payin-pagination" aria-label="Transaction report pagination">
        <span>
          {list.data?.Paging.TotalRecords ?? 0} records ? Up to {filters.PageSize} per page
        </span>
        <button
          className="secondary"
          disabled={list.isFetching || page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>
          Page {page} of {Math.max(1, list.data?.Paging.TotalPages ?? 1)}
        </span>
        <button
          className="secondary"
          disabled={list.isFetching || list.isError || !list.data?.Paging.HasNextPage}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </nav>
    </section>
  );
}
