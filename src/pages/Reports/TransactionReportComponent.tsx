import { useEffect, useState, type FormEvent } from 'react';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import { useQuery } from '@tanstack/react-query';
import { ReportService, type TransactionReportRequest } from '../../services/ReportService';
import { ErrorState, Loading } from '../../components/Status';
import { exportToExcel } from '../../core/exportToExcel';
import { OrgMgrService } from '../../services/OrgMgrService';
import { MasterDataService } from '../../services/MasterDataService';
import { UserMgrService } from '../../services/UserMgrservice';
import { useAuth } from '../../core/auth';
import { today, value, records } from '../Wallet/payinRequests';
import { z } from 'zod';
import '../Masters/MasterDataCrudPage.css';
import '../Wallet/PayinRequestList.css';
import './TransactionReport.css';

const fields = [
  ['TransactionCode', 'Transaction code', 'text'],
  ['RefNo', 'Reference number', 'text'],
  ['PartnerTxnId', 'Partner transaction ID', 'text'],
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

function rowValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const match = value(row, key);
    if (match !== undefined && match !== null && match !== '') return match;
  }
  return undefined;
}

function userLabel(row: Record<string, unknown>) {
  const name = ['FirstName', 'MiddleName', 'LastName']
    .map((key) => String(value(row, key) ?? '').trim())
    .filter(Boolean)
    .join(' ');
  const username = String(value(row, 'UserName') ?? '').trim();
  const displayName =
    String(rowValue(row, ['DisplayName', 'Name', 'FullName', 'Description', 'Label']) ?? '').trim() ||
    String(value(row, 'UserName') ?? '').trim() ||
    String(value(row, 'Code') ?? '').trim();
  return (
    `${name}${username ? ` [${username}]` : ''}`.trim() ||
    displayName ||
    `User ${userMasterId(row) || 'unknown'}`
  );
}

function userMasterId(row: Record<string, unknown>) {
  const raw = rowValue(row, [
    'UserMasterID',
    'UserMasterId',
    'UserID',
    'UserId',
    'Id',
    'ID',
    'Value',
    'Code',
  ]);
  const parsed = Number(raw ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parentId(row: Record<string, unknown>) {
  const raw = rowValue(row, [
    'ParentId',
    'ParentID',
    'ParentUserMasterId',
    'ParentUserMasterID',
    'ParentUserId',
    'ParentUserID',
    'ParentCode',
    'MdsId',
    'MDSId',
    'MdsID',
    'DSId',
    'DSID',
  ]);
  const parsed = Number(raw ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function TransactionReportComponent() {
  const { session } = useAuth();
  const [draft, setDraft] = useState(initial);
  const [filters, setFilters] = useState(draft);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<unknown>();
  const [isExpanded, setIsExpanded] = useState(true);
  const [mdsId, setMdsId] = useState('');
  const [dsId, setDsId] = useState('');
  const [agentId, setAgentId] = useState('');
  const currentUserTypeId = session?.userTypeId ?? 0;
  const currentUserName = session?.username ?? '';
  const currentUser = useQuery({
    queryKey: ['transaction-report-user', currentUserName],
    enabled: !!currentUserName,
    queryFn: async ({ signal }) => {
      const response = await UserMgrService.getUserMasterByUserName(currentUserName, signal);
      const result = response?.Result;
      if (Array.isArray(result)) return (result[0] ?? {}) as Record<string, unknown>;
      if (result && typeof result === 'object') return result as Record<string, unknown>;
      return {} as Record<string, unknown>;
    },
    retry: false,
  });
  const masterDistributors = useQuery({
    queryKey: ['transaction-report-mds'],
    enabled: !!session,
    queryFn: async ({ signal }) => {
      try {
        if (typeof UserMgrService.getParentCodeList === 'function') {
          const response = await UserMgrService.getParentCodeList(3, signal);
          const rows = records(response.Result);
          if (rows.length) return rows;
        }
      } catch {
        // fall through to the legacy user hierarchy lookup below
      }
      return records((await UserMgrService.getUserMastersByUserTypeId(3, signal)).Result);
    },
    retry: false,
  });
  const distributorUsers = useQuery({
    queryKey: ['transaction-report-ds', mdsId, currentUserTypeId],
    enabled: !!session && (currentUserTypeId === 5 || !!mdsId),
    queryFn: async ({ signal }) => {
      try {
        if (currentUserTypeId === 5 && typeof UserMgrService.getParentCodeList === 'function') {
          const response = await UserMgrService.getParentCodeList(4, signal);
          const rows = records(response.Result);
          if (rows.length) return rows;
        }
      } catch {
        // fall through to the legacy parent lookup below
      }
      const response = await UserMgrService.getUsersByParentId(Number(mdsId), 4, signal);
      return records(response.Result);
    },
    retry: false,
  });
  const retailerUsers = useQuery({
    queryKey: ['transaction-report-agent', dsId],
    enabled: !!dsId && !!session,
    queryFn: async ({ signal }) =>
      records((await UserMgrService.getUsersByParentId(Number(dsId), 5, signal)).Result),
    retry: false,
  });
  const applyMdsSelection = (nextMdsId: string) => {
    setMdsId(nextMdsId);
    setDsId('');
    setAgentId('');
  };
  const applyDsSelection = (nextDsId: string) => {
    setDsId(nextDsId);
    setAgentId('');
    const selectedDistributor = (distributorUsers.data ?? []).find(
      (row) => userMasterId(row as Record<string, unknown>) === Number(nextDsId),
    );
    if (selectedDistributor) {
      const nextParentId = parentId(selectedDistributor as Record<string, unknown>);
      if (nextParentId) setMdsId(String(nextParentId));
    }
  };
  const applyAgentSelection = (nextAgentId: string) => {
    setAgentId(nextAgentId);
    const selectedAgent = (retailerUsers.data ?? []).find(
      (row) => userMasterId(row as Record<string, unknown>) === Number(nextAgentId),
    );
    if (!selectedAgent) return;
    const nextDsId = String(parentId(selectedAgent as Record<string, unknown>) || '');
    if (nextDsId) {
      setDsId(nextDsId);
      const selectedDistributor = (distributorUsers.data ?? []).find(
        (row) => userMasterId(row as Record<string, unknown>) === Number(nextDsId),
      );
      if (selectedDistributor) {
        const nextMdsId = String(parentId(selectedDistributor as Record<string, unknown>) || '');
        if (nextMdsId) setMdsId(nextMdsId);
      }
    }
  };
  useEffect(() => {
    if (!currentUser.isSuccess || !currentUser.data) return;
    const record = currentUser.data as Record<string, unknown>;
    const currentUserMasterId = Number(
      rowValue(record, ['UserMasterID', 'UserMasterId', 'UserID', 'UserId']) ?? 0,
    );
    const userTypeId = Number(rowValue(record, ['UserTypeId', 'UserTypeID']) ?? 0);
    const parentValue = rowValue(record, [
      'ParentId',
      'ParentID',
      'ParentUserMasterId',
      'ParentUserMasterID',
      'MdsId',
      'MDSId',
      'DsId',
      'DSId',
    ]);
    const parent = Number(parentValue ?? 0);
    if (userTypeId === 3) setMdsId(currentUserMasterId ? String(currentUserMasterId) : '');
    else if (userTypeId === 4) {
      setDsId(currentUserMasterId ? String(currentUserMasterId) : '');
      setMdsId(parent ? String(parent) : '');
    } else if (userTypeId === 5) {
      setAgentId(currentUserMasterId ? String(currentUserMasterId) : '');
      setDsId(parent ? String(parent) : '');
      if (parent) {
        const selectedDistributor = distributorUsers.data ?? [];
        const parentMatch = selectedDistributor.find(
          (row) => userMasterId(row as Record<string, unknown>) === parent,
        );
        if (parentMatch) {
          const nextMdsId = parentId(parentMatch as Record<string, unknown>);
          if (nextMdsId) setMdsId(String(nextMdsId));
        }
      }
    }
  }, [currentUser.data, currentUser.isSuccess, distributorUsers.data]);
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
  const lookupQueries = { ServiceId: services, AgencyId: agencies };
  const selectedUserMasterId = agentId || dsId || mdsId || null;
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
    UserMasterId: selectedUserMasterId ? Number(selectedUserMasterId) : null,
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
        <div className="transaction-report-form-header">
          <span className="transaction-report-form-title">Filters</span>
          <button
            type="button"
            className="secondary transaction-report-toggle"
            aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? <ExpandLessOutlinedIcon /> : <ExpandMoreOutlinedIcon />}
          </button>
        </div>
        {isExpanded && (
          <>
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
              {currentUserTypeId !== 5 && (
                <>
                  <label className="master-field">
                    MDS
                    <select
                      value={mdsId}
                      disabled={currentUserTypeId === 3 || currentUserTypeId === 4}
                      onChange={(event) => applyMdsSelection(event.target.value)}
                    >
                      <option value="">Select MDS</option>
                      {records(masterDistributors.data ?? []).map((row) => {
                        const rowId = String(userMasterId(row as Record<string, unknown>));
                        return (
                          <option key={rowId} value={rowId}>
                            {userLabel(row as Record<string, unknown>)}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                  <label className="master-field">
                    DS
                    <select
                      value={dsId}
                      disabled={currentUserTypeId === 4 || !mdsId}
                      onChange={(event) => applyDsSelection(event.target.value)}
                    >
                      <option value="">Select DS</option>
                      {records(distributorUsers.data ?? []).map((row) => {
                        const rowId = String(userMasterId(row as Record<string, unknown>));
                        return (
                          <option key={rowId} value={rowId}>
                            {userLabel(row as Record<string, unknown>)}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                </>
              )}
              <label className="master-field">
                Retailer / Agent
                <select
                  value={agentId}
                  disabled={currentUserTypeId === 5 || !dsId}
                  onChange={(event) => applyAgentSelection(event.target.value)}
                >
                  <option value="">Select retailer / agent</option>
                  {records(retailerUsers.data ?? []).map((row) => {
                    const rowId = String(userMasterId(row as Record<string, unknown>));
                    return (
                      <option key={rowId} value={rowId}>
                        {userLabel(row as Record<string, unknown>)}
                      </option>
                    );
                  })}
                </select>
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
          </>
        )}
      </form>
      {[services, agencies].map((query, index) =>
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
