import { useState, type FormEvent } from 'react';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useQuery } from '@tanstack/react-query';
import { ReportService, type UserMasterListReportRequest } from '../../services/ReportService';
import { ErrorState, Loading } from '../../components/Status';
import { exportToExcel } from '../../core/exportToExcel';
import { MasterDataService } from '../../services/MasterDataService';
import { today, value, records } from '../Wallet/payinRequests';
import { z } from 'zod';
import '../Masters/MasterDataCrudPage.css';
import '../Wallet/PayinRequestList.css';
import './TransactionReport.css';

const fields = [
  ['FreeTextSearch', 'Search text', 'text'],
  ['UserTypeId', 'User type', 'number'],
  ['ParentId', 'Parent ID', 'number'],
  ['Status', 'Status ID', 'number'],
] as const;
const columns = [
  ['UserMasterID', 'User ID'],
  ['ParentId', 'Parent ID'],
  ['UserTypeId', 'User type ID'],
  ['UserTypeName', 'User type'],
  ['OrganizationID', 'Organization ID'],
  ['OrganizationName', 'Organization'],
  ['DomainUserName', 'Domain user name'],
  ['UserName', 'User name'],
  ['Title', 'Title'],
  ['FirstName', 'First name'],
  ['MiddleName', 'Middle name'],
  ['LastName', 'Last name'],
  ['DisplayName', 'Display name'],
  ['GenderID', 'Gender ID'],
  ['IsPasswordExpired', 'Password expired'],
  ['UserId', 'Account user ID'],
  ['IsLocked', 'Locked'],
  ['LockedTill', 'Locked until'],
  ['EmailId', 'Email'],
  ['MobileNo', 'Mobile number'],
  ['ParentUserMasterID', 'Parent user ID'],
  ['ParentUserTypeId', 'Parent user type ID'],
  ['ParentUserTypeName', 'Parent user type'],
  ['ParentUserName', 'Parent user name'],
  ['ParentName', 'Parent name'],
  ['ParentEmailId', 'Parent email'],
  ['RemarkReason', 'Remark reason'],
  ['Status', 'Status ID'],
  ['StatusName', 'Status'],
  ['ParentMobileNo', 'Parent mobile number'],
  ['DSUserMasterID', 'Distributor user ID'],
  ['DSCode', 'Distributor code'],
  ['DSName', 'Distributor name'],
  ['DSEmail', 'Distributor email'],
  ['DSMobileNo', 'Distributor mobile number'],
  ['MDSUserMasterID', 'Master distributor user ID'],
  ['MDSCode', 'Master distributor code'],
  ['MDSName', 'Master distributor name'],
  ['MDSEmail', 'Master distributor email'],
  ['MDSMobileNo', 'Master distributor mobile number'],
  ['CreatedOn', 'Created on'],
  ['CreatedBy', 'Created by ID'],
  ['CreatedByUserName', 'Created by user name'],
  ['CreatedByName', 'Created by name'],
  ['UpdatedOn', 'Updated on'],
  ['UpdatedBy', 'Updated by ID'],
  ['UpdatedByUserName', 'Updated by user name'],
  ['UpdatedByName', 'Updated by name'],
] as const;
const hiddenGridColumns = new Set<string>([
  'ParentId',
  'UserTypeId',
  'OrganizationID',
  'DomainUserName',
  'FirstName',
  'MiddleName',
  'LastName',
  'DisplayName',
  'GenderID',
  'IsPasswordExpired',
  'UserId',
  'IsLocked',
  'LockedTill',
  'Status',
  'ParentUserMasterID',
  'ParentUserTypeId',
  'ParentMobileNo',
  'DSUserMasterID',
  'DSCode',
  'DSName',
  'DSEmail',
  'DSMobileNo',
  'MDSUserMasterID',
  'MDSCode',
  'MDSName',
  'MDSEmail',
  'MDSMobileNo',
  'CreatedBy',
  'CreatedByUserName',
  'UpdatedBy',
  'UpdatedByUserName',
]);
const gridColumns = columns.flatMap(([key, label]): [string, string][] =>
  key === 'FirstName' ? [['Name', 'Name']] : hiddenGridColumns.has(key) ? [] : [[key, label]],
);

function reportCell(row: Record<string, unknown>, key: string): string {
  if (key === 'Name') {
    return ['FirstName', 'MiddleName', 'LastName']
      .map((part) => String(value(row, part) ?? '').trim())
      .filter(Boolean)
      .join(' ');
  }
  const text = String(value(row, key) ?? '');
  if (key === 'CreatedOn' || key === 'UpdatedOn') {
    const date = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/.exec(text);
    if (date) return `${date[3]}-${date[2]}-${date[1]}`;
  }
  return text;
}

const schema = z.object({
  Data: z.array(z.record(z.string(), z.unknown())),
  TotalRecords: z.number().int().nonnegative(),
  PageNumber: z.number().int().positive(),
  PageSize: z.number().int().positive(),
  TotalPages: z.number().int().nonnegative(),
});
const initial = (): Record<string, string> => ({
  FromDate: today(),
  ToDate: today(),
  PageSize: '20',
  SortColumn: 'UserMasterID',
  SortDirection: 'DESC',
});

export default function UserListReportComponent() {
  const [draft, setDraft] = useState(initial);
  const [filters, setFilters] = useState(draft);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<unknown>();
  const userTypes = useQuery({
    queryKey: ['report-user-types'],
    queryFn: ({ signal }) => MasterDataService.getActiveUserTypes(signal),
    retry: false,
  });
  const lookupOptions: Record<string, { id: string; name: string }[]> = {
    UserTypeId: records(userTypes.data?.Result).map((row) => ({
      id: String(value(row, 'UserTypeId')),
      name: String(value(row, 'UserTypeName') ?? ''),
    })),
  };
  const lookupQueries = { UserTypeId: userTypes };
  const body: UserMasterListReportRequest = {
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
    queryKey: ['user-master-list-report', body],
    queryFn: async ({ signal }) => {
      const response = await ReportService.getUserMasterListReport(body, signal);
      const parsed = schema.safeParse(response.Result);
      if (!parsed.success) throw new Error('The server returned an unexpected user list report.');
      return parsed.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
  const rows = list.isError ? [] : (list.data?.Data ?? []);
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
          <h1>User List Report</h1>
          <p>Search users for the selected dates.</p>
        </div>
      </div>
      <form className="card master-form" aria-label="Search users" onSubmit={search}>
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
          <label className="master-field">
            Page size
            <select
              value={draft.PageSize}
              onChange={(event) => change('PageSize', event.target.value)}
            >
              {[20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <label className="master-field">
            Sort by
            <select
              value={draft.SortColumn}
              onChange={(event) => change('SortColumn', event.target.value)}
            >
              {columns.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="master-field">
            Sort direction
            <select
              value={draft.SortDirection}
              onChange={(event) => change('SortDirection', event.target.value)}
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
          </label>
        </div>
        <button type="submit" disabled={list.isFetching}>
          Search
        </button>
      </form>
      {[userTypes].map((query, index) =>
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
              `User list report page ${page}`,
              columns.map(([, label]) => label),
              rows.map((row) =>
                Object.fromEntries(
                  columns.map(([key, label]) => [label, reportCell(row, key)]),
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
        <table aria-label="User list report" aria-busy={list.isFetching}>
          <thead>
            <tr>
              {gridColumns.map(([key, label]) => (
                <th key={key}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(value(row, 'UserMasterID'))}>
                {gridColumns.map(([key]) => (
                  <td key={key}>{reportCell(row, key)}</td>
                ))}
              </tr>
            ))}
            {!rows.length && !list.isFetching && !list.isError && (
              <tr>
                <td colSpan={gridColumns.length}>No users found for the selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <nav className="payin-pagination" aria-label="User list report pagination">
        <span>
          {list.data?.TotalRecords ?? 0} records · Up to {filters.PageSize} per page
        </span>
        <button
          className="secondary"
          disabled={list.isFetching || page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>
          Page {page} of {Math.max(1, list.data?.TotalPages ?? 1)}
        </span>
        <button
          className="secondary"
          disabled={
            list.isFetching ||
            list.isError ||
            !list.data ||
            list.data.PageNumber >= list.data.TotalPages
          }
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </nav>
    </section>
  );
}
