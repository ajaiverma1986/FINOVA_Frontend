import CreatePanelDialog from './CreatePanelDialog';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { AppMgrService, type UpdateApplicationRequest } from '../../services/AppMgrService';
import { ErrorState, Loading } from '../../components/Status';
import { OrgMgrService } from '../../services/OrgMgrService';

type Row = Record<string, unknown>;
type Mode = 'create' | 'edit' | 'view' | null;

type ApplicationForm = Omit<UpdateApplicationRequest, 'ApplicationID'> & {
  ApplicationID: number;
};

const emptyForm: ApplicationForm = {
  ApplicationID: 0,
  OrganizationID: 0,
  ApplicationTypeID: 0,
  PlatformID: 0,
  IconID: 0,
  ApplicationToken: '',
  ApplicationName: '',
  ApplicationDescription: '',
  TokenCreatedDate: '',
  TokenExpireDate: null,
  UserTokenExpiresAfterMins: 0,
  Status: 1,
};

const columns = [
  'ApplicationID',
  'OrganizationName',
  'Email',
  'MobileNo',
  'ApplicationName',
  'ApplicationToken',
  'StatusName',
];
const PAGE_SIZE = 20;
type SortState = { column: string; direction: 'asc' | 'desc' } | null;

function records(value: unknown): Row[] {
  if (Array.isArray(value))
    return value.filter((item): item is Row => Boolean(item) && typeof item === 'object');
  if (value && typeof value === 'object') {
    const nested = Object.values(value).find(Array.isArray);
    return nested ? records(nested) : [value as Row];
  }
  return [];
}

function numberValue(value: unknown) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function value(row: Row, key: string) {
  const matchingKey = Object.keys(row).find((item) => item.toLowerCase() === key.toLowerCase());
  const result = matchingKey ? row[matchingKey] : undefined;
  if (key === 'StatusName' && (result == null || result === '')) {
    const statusKey = Object.keys(row).find((item) => item.toLowerCase() === 'status');
    const status = String(statusKey ? row[statusKey] : undefined);
    return status === '1' ? 'Active' : status === '0' ? 'Inactive' : undefined;
  }
  return result;
}

function rowId(row: Row) {
  return numberValue(value(row, 'ApplicationID'));
}

function toForm(row: Row): ApplicationForm {
  return {
    ApplicationID: rowId(row),
    OrganizationID: numberValue(value(row, 'OrganizationID')),
    ApplicationTypeID: numberValue(value(row, 'ApplicationTypeID')),
    PlatformID: numberValue(value(row, 'PlatformID')),
    IconID: numberValue(value(row, 'IconID')),
    ApplicationToken: String(value(row, 'ApplicationToken') ?? ''),
    ApplicationName: String(value(row, 'ApplicationName') ?? ''),
    ApplicationDescription: String(value(row, 'ApplicationDescription') ?? ''),
    TokenCreatedDate: String(value(row, 'TokenCreatedDate') ?? ''),
    TokenExpireDate: value(row, 'TokenExpireDate')
      ? String(value(row, 'TokenExpireDate'))
      : null,
    UserTokenExpiresAfterMins: numberValue(value(row, 'UserTokenExpiresAfterMins')),
    Status: numberValue(value(row, 'Status')),
  };
}

export default function AppManagerComponent() {
  const cache = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<ApplicationForm>(emptyForm);
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);

  const list = useQuery({
    queryKey: ['app-manager', activeOnly],
    queryFn: async ({ signal }) =>
      records(
        (
          await (activeOnly
            ? AppMgrService.getActiveApplications(signal)
            : AppMgrService.getAllApplications(signal))
        ).Result,
      ),
    retry: false,
  });
  const organizations = useQuery({
    queryKey: ['organization-master', true],
    enabled: mode === 'create' || mode === 'edit',
    queryFn: async ({ signal }) => records((await OrgMgrService.getActiveOrganizations(signal)).Result),
    retry: false,
  });
  const organizationOptions = (organizations.data ?? [])
    .filter((row) => numberValue(value(row, 'OrganizationID')) > 0)
    .map((row) => ({
      id: numberValue(value(row, 'OrganizationID')),
      name: String(value(row, 'OrganizationName') ?? value(row, 'DisplayName') ?? value(row, 'OrganizationID')),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const selectedOrganizationActive = organizationOptions.some((item) => item.id === form.OrganizationID);
  const detail = useQuery({
    queryKey: ['app-manager', 'detail', selectedId],
    enabled: selectedId !== null && mode !== 'create',
    queryFn: async ({ signal }) =>
      records((await AppMgrService.getApplicationById(selectedId!, signal)).Result)[0],
    retry: false,
  });
  const remove = useMutation({
    mutationFn: (id: number) => AppMgrService.deleteApplication(id),
    onSuccess: async () => {
      setMessage('Application deleted.');
      setSelectedId(null);
      setMode(null);
      await cache.invalidateQueries({ queryKey: ['app-manager'] });
    },
    onError: setError,
  });

  useEffect(() => {
    if (mode === 'create') setForm(emptyForm);
    if (mode === 'edit' && detail.data) setForm(toForm(detail.data));
  }, [detail.data, mode]);

  useEffect(() => {
    setPage(1);
  }, [activeOnly, list.data]);

  const visibleRows = useMemo(() => {
    const filtered = (list.data ?? []).filter((row) =>
      columns.every((column) => {
        const filter = filters[column]?.trim().toLocaleLowerCase();
        return !filter || String(value(row, column) ?? '').toLocaleLowerCase().includes(filter);
      }),
    );
    const sorted = [...filtered];
    if (sort) {
      sorted.sort((left, right) => {
        const leftValue = value(left, sort.column);
        const rightValue = value(right, sort.column);
        const comparison =
          typeof leftValue === 'number' && typeof rightValue === 'number'
            ? leftValue - rightValue
            : String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, {
                numeric: true,
                sensitivity: 'base',
              });
        return sort.direction === 'asc' ? comparison : -comparison;
      });
    }
    return sorted;
  }, [filters, list.data, sort]);
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = visibleRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function sortBy(column: string) {
    setPage(1);
    setSort((current) =>
      current?.column === column
        ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' },
    );
  }

  function filterBy(column: string, filter: string) {
    setPage(1);
    setFilters((current) => ({ ...current, [column]: filter }));
  }

  function open(modeToOpen: Exclude<Mode, null>, row?: Row) {
    setError(undefined);
    setMessage('');
    setMode(modeToOpen);
    const id = row ? rowId(row) : null;
    setSelectedId(id || null);
    if (modeToOpen === 'view' && row) setForm(toForm(row));
    if (modeToOpen === 'edit' && row) setForm(toForm(row));
  }

  function updateField<K extends keyof ApplicationForm>(field: K, fieldValue: ApplicationForm[K]) {
    setForm((current) => ({ ...current, [field]: fieldValue }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (organizations.isPending || organizations.isError || !selectedOrganizationActive) return;
    setError(undefined);
    try {
      if (mode === 'create') {
        await AppMgrService.createApplication({
          OrganizationID: form.OrganizationID,
          ApplicationName: form.ApplicationName.trim(),
          ApplicationDescription: form.ApplicationDescription.trim(),
        });
        setMessage('Application created.');
      } else {
        await AppMgrService.updateApplication(form);
        setMessage('Application updated.');
      }
      setMode(null);
      setSelectedId(null);
      await cache.invalidateQueries({ queryKey: ['app-manager'] });
    } catch (caught) {
      setError(caught);
    }
  }

  if (list.isPending) return <Loading />;
  if (list.isError) return <ErrorState error={list.error} retry={() => void list.refetch()} />;

  return (
    <section className="card master-data-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">APIM</p>
          <h1>Application Manager</h1>
        </div>
        <button type="button" onClick={() => open('create')}>
          Create application
        </button>
      </div>
      {message && <p className="notice success" role="status">{message}</p>}
      <div className="master-toolbar">
        <label>
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => setActiveOnly(event.target.checked)}
          />{' '}
          Active only
        </label>
        <button className="secondary" type="button" onClick={() => void list.refetch()}>
          Refresh
        </button>
      </div>
      {!list.data.length ? (
        <p>No applications found.</p>
      ) : (
        <div className="master-table-wrap">
          <table aria-label="Applications">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column} aria-sort={sort?.column === column ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button type="button" className="master-sort" onClick={() => sortBy(column)}>
                      {column}
                      <span aria-hidden="true">
                        {sort?.column === column ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                      </span>
                    </button>
                  </th>
                ))}
                <th>Actions</th>
              </tr>
              <tr className="master-filter-row">
                {columns.map((column) => (
                  <th key={column}>
                    <input
                      type="search"
                      value={filters[column] ?? ''}
                      placeholder="Filter"
                      aria-label={`Filter by ${column}`}
                      onChange={(event) => filterBy(column, event.target.value)}
                    />
                  </th>
                ))}
                <th>
                  <button
                    type="button"
                    className="secondary master-clear-filters"
                    disabled={!Object.values(filters).some(Boolean)}
                    onClick={() => {
                      setPage(1);
                      setFilters({});
                    }}
                  >
                    Clear
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {!pagedRows.length ? (
                <tr>
                  <td colSpan={columns.length + 1}>No records match the selected filters.</td>
                </tr>
              ) : pagedRows.map((row, index) => (
                <tr key={rowId(row) || index}>
                  {columns.map((column) => (
                    <td key={column}>{String(value(row, column) ?? '—')}</td>
                  ))}
                  <td>
                    <div className="master-actions">
                      <button
                        type="button"
                        className="master-action view"
                        title="View application"
                        aria-label="View application"
                        onClick={() => open('view', row)}
                      >
                        <VisibilityOutlinedIcon fontSize="small" /> View
                      </button>
                      <button
                        type="button"
                        className="master-action edit"
                        title="Edit application"
                        aria-label="Edit application"
                        onClick={() => open('edit', row)}
                      >
                        <EditOutlinedIcon fontSize="small" /> Edit
                      </button>
                      <button
                        type="button"
                        className="master-action delete"
                        title="Delete application"
                        aria-label="Delete application"
                        onClick={() => {
                          if (window.confirm('Delete this application?')) remove.mutate(rowId(row));
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!!visibleRows.length && (
        <nav className="toolbar pagination master-pagination" aria-label="Application pagination">
          <span>
            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, visibleRows.length)} of{' '}
            {visibleRows.length} records · Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className="secondary"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            className="secondary"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </nav>
      )}
      {mode && (
        <CreatePanelDialog create={mode === 'create'} view={mode === 'view'} title={mode === 'view' ? 'Application details' : 'Create application'} onClose={() => setMode(null)}><section className="card gateway-editor" aria-label={`${mode} application`}>
          <button type="button" className="secondary" onClick={() => setMode(null)}>Close</button>
          <h2>{mode === 'create' ? 'Create application' : mode === 'edit' ? 'Update application' : 'Application details'}</h2>
          {detail.isPending && mode !== 'create' ? <Loading /> : mode === 'view' ? (
            <dl className="master-details">
              {Object.entries(detail.data ?? form).map(([key, item]) => (
                <div key={key}><dt>{key}</dt><dd>{String(item ?? '—')}</dd></div>
              ))}
            </dl>
          ) : (
            <form className="master-form" onSubmit={submit}>
              {error != null && <ErrorState error={error} />}
              {organizations.isError && <ErrorState error={organizations.error} retry={() => void organizations.refetch()} />}
              <label className="master-field">Organization
                <select required value={selectedOrganizationActive ? form.OrganizationID : ''}
                  disabled={organizations.isPending || organizations.isError}
                  onChange={(event) => updateField('OrganizationID', Number(event.target.value))}>
                  <option value="" disabled>{organizations.isPending ? 'Loading organizations...' : 'Select organization'}</option>
                  {organizationOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              {organizations.isSuccess && !organizationOptions.length && <p role="status">No active organizations available.</p>}
              {mode === 'edit' && organizations.isSuccess && form.OrganizationID > 0 && !selectedOrganizationActive && <p role="status">The current organization is unavailable. Select an active organization.</p>}
              <label className="master-field">Application name<input required value={form.ApplicationName} onChange={(event) => updateField('ApplicationName', event.target.value)} /></label>
              <label className="master-field">Description<textarea required value={form.ApplicationDescription} onChange={(event) => updateField('ApplicationDescription', event.target.value)} /></label>
              {mode === 'edit' && (
                <>
                  <label className="master-field">Application type ID<input type="number" value={form.ApplicationTypeID} onChange={(event) => updateField('ApplicationTypeID', Number(event.target.value))} /></label>
                  <label className="master-field">Platform ID<input type="number" value={form.PlatformID} onChange={(event) => updateField('PlatformID', Number(event.target.value))} /></label>
                  <label className="master-field">Icon ID<input type="number" value={form.IconID} onChange={(event) => updateField('IconID', Number(event.target.value))} /></label>
                  <label className="master-field">Application token<input value={form.ApplicationToken} onChange={(event) => updateField('ApplicationToken', event.target.value)} /></label>
                  <label className="master-field">Token created date<input value={form.TokenCreatedDate} onChange={(event) => updateField('TokenCreatedDate', event.target.value)} /></label>
                  <label className="master-field">Token expiry date<input value={form.TokenExpireDate ?? ''} onChange={(event) => updateField('TokenExpireDate', event.target.value || null)} /></label>
                  <label className="master-field">User token expiry minutes<input type="number" value={form.UserTokenExpiresAfterMins} onChange={(event) => updateField('UserTokenExpiresAfterMins', Number(event.target.value))} /></label>
                  <label className="master-field">Status<select value={form.Status} onChange={(event) => updateField('Status', Number(event.target.value))}><option value={1}>Active</option><option value={0}>Inactive</option></select></label>
                </>
              )}
              <button type="submit" disabled={organizations.isPending || organizations.isError || !selectedOrganizationActive}>{mode === 'create' ? 'Create application' : 'Update application'}</button>
            </form>
          )}
        </section></CreatePanelDialog>
      )}
    </section>
  );
}
