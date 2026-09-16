import { exportToExcel } from '../../core/exportToExcel';
import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { request } from '../../core/api';
import { MasterDataService } from '../../services/MasterDataService';
import { ErrorState, Loading } from '../../components/Status';
import { masterDataResources, type MasterResourceKey } from './masterDataResources';
import './MasterDataCrudPage.css';

type Row = Record<string, unknown>;
const MASTER_PAGE_SIZE = 20;
type SortState = { column: string; direction: 'asc' | 'desc' };

function records(value: unknown): Row[] {
  if (Array.isArray(value))
    return value.filter((item): item is Row => !!item && typeof item === 'object');
  if (value && typeof value === 'object') {
    const object = value as Row;
    const nested = Object.values(object).find(Array.isArray);
    if (nested) return records(nested);
    return [object];
  }
  return [];
}

function numberId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function rowId(row: Row, idField: string) {
  const exact = row[idField];
  if (exact !== undefined) return numberId(exact);
  const key = Object.keys(row).find((item) => item.toLowerCase() === idField.toLowerCase());
  return key ? numberId(row[key]) : null;
}

export default function MasterDataCrudPage({ resourceKey }: { resourceKey: MasterResourceKey }) {
  const resource = masterDataResources[resourceKey];
  const pathname = useLocation().pathname.toLowerCase();
  const mode = pathname.endsWith('/create')
    ? 'create'
    : pathname.endsWith('/edit')
      ? 'edit'
      : pathname.endsWith('/view')
        ? 'view'
        : 'list';
  return mode === 'list' ? (
    <MasterList resourceKey={resourceKey} />
  ) : (
    <MasterRecord resourceKey={resourceKey} mode={mode} />
  );
}

function MasterList({ resourceKey }: { resourceKey: MasterResourceKey }) {
  const resource = masterDataResources[resourceKey];
  const location = useLocation();
  const [activeOnly, setActiveOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [message, setMessage] = useState<string>(
    (location.state as { message?: string } | null)?.message || '',
  );
  const cache = useQueryClient();
  const queryKey = ['master-data', resource.key];
  const query = useQuery({
    queryKey: [...queryKey, activeOnly],
    // A menu click always opens the complete list first, just like the
    // notification-template list. Active-only is an explicit user filter.
    refetchOnMount: 'always',
    queryFn: async ({ signal }) =>
      records(
        (
          await request(
            activeOnly && resource.activePath ? resource.activePath : resource.listPath,
            { signal },
          )
        ).Result,
      ),
  });
  const remove = useMutation({
    mutationFn: (id: number) => request(resource.deletePath(id), { method: 'DELETE' }),
    onSuccess: async () => {
      setDeleting(null);
      setMessage(`${resource.singular[0].toUpperCase()}${resource.singular.slice(1)} deleted.`);
      await cache.invalidateQueries({ queryKey });
    },
  });
  const columns = useMemo(
    () => [
      resource.idField,
      ...(resource.key === 'state'
        ? [
            'CountryName',
            'RegionName',
            ...resource.fields
              .filter((item) => !['StateFlagID', 'CountryID', 'RegionID'].includes(item.name))
              .map((item) => (item.name === 'Status' ? 'StatusName' : item.name)),
          ]
        : resource.fields.filter((item) => item.name !== resource.idField &&
            !(resource.key === 'paymentAccount' && ['Micrcode', 'BranchAddress'].includes(item.name))).map((item) =>
            resource.key === 'paymentAccount' && item.name === 'BankID' ? 'BankName' : item.name === 'Status'
              ? 'StatusName'
                : resource.key === 'district' && item.name === 'StateID'
                  ? 'StateName'
                  : resource.key === 'paymentMode' && item.name === 'PaymentChanelID'
                ? 'PaymentChanelName'
                : resource.key === 'kycType' && item.name === 'UserTypeID'
                  ? 'UserTypeName'
                  : resource.key === 'kycType' && item.name === 'CompanyTypeId'
                    ? 'CompanyTypeName'
                    : item.name,
          )),
    ],
    [resource],
  );
  const filteredRecords = useMemo(
    () =>
      (query.data ?? []).filter((row) =>
        columns.every((column) => {
          const filter = filters[column]?.trim().toLocaleLowerCase();
          return (
            !filter ||
            String(row[column] ?? '')
              .toLocaleLowerCase()
              .includes(filter)
          );
        }),
      ),
    [columns, filters, query.data],
  );
  const sortedRecords = useMemo(() => {
    const result = [...filteredRecords];
    if (!sort) return result;
    return result.sort((left, right) => {
      const leftValue = left[sort.column];
      const rightValue = right[sort.column];
      const comparison =
        typeof leftValue === 'number' && typeof rightValue === 'number'
          ? leftValue - rightValue
          : String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, {
              numeric: true,
              sensitivity: 'base',
            });
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredRecords, sort]);
  const totalRecords = sortedRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / MASTER_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstRecord = (currentPage - 1) * MASTER_PAGE_SIZE;
  const visibleRecords = sortedRecords.slice(firstRecord, firstRecord + MASTER_PAGE_SIZE);

  function sortBy(column: string) {
    setPage(1);
    setSort((current) =>
      current?.column === column
        ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' },
    );
  }
  return (
    <section className="card master-data-page">
      <div className="page-heading">
        <h1>{resource.plural}</h1>
        <Link className="button" to={`${resource.basePath}/Create`}>
          Create {resource.singular}
        </Link>
      </div>
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      <div className="master-toolbar">
        {resource.activePath && (
          <label>
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(event) => {
                setPage(1);
                setActiveOnly(event.target.checked);
              }}
            />{' '}
            Active only
          </label>
        )}
        <button
          className="secondary"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Refresh
        </button>
        <button
          type="button"
          className="secondary"
          disabled={!sortedRecords.length || query.isFetching}
          onClick={() => exportToExcel(resource.plural, columns, sortedRecords)}
        >
          Export to Excel
        </button>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : !query.data.length ? (
        <p>No {resource.plural.toLowerCase()} found.</p>
      ) : (
        <>
          <div className="master-table-wrap">
            <table aria-label={resource.plural}>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      aria-sort={
                        sort?.column === column
                          ? sort.direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button type="button" className="master-sort" onClick={() => sortBy(column)}>
                        {column === 'BankName' ? 'Bank name' : column === 'StatusName'
                          ? 'Status'
                          : column === 'PaymentChanelName'
                            ? 'Payment channel name'
                            : column === 'UserTypeName'
                              ? 'User type name'
                              : column === 'CompanyTypeName'
                                ? 'Company type name'
                                : column === 'CountryName'
                                  ? 'Country name'
                                  : column === 'RegionName'
                                    ? 'Region name'
                                    : column === 'StateName'
                                      ? 'State name'
                                : resource.fields.find((item) => item.name === column)?.label || 'ID'}
                        <span aria-hidden="true">
                          {sort?.column === column
                            ? sort.direction === 'asc'
                              ? ' ↑'
                              : ' ↓'
                            : ' ↕'}
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
                        aria-label={`Filter by ${column === 'BankName' ? 'Bank name' : column === 'StatusName' ? 'Status' : column === 'PaymentChanelName' ? 'Payment channel name' : column === 'UserTypeName' ? 'User type name' : column === 'CompanyTypeName' ? 'Company type name' : column === 'CountryName' ? 'Country name' : column === 'RegionName' ? 'Region name' : column === 'StateName' ? 'State name' : resource.fields.find((item) => item.name === column)?.label || 'ID'}`}
                        onChange={(event) => {
                          const value = event.target.value;
                          setPage(1);
                          setFilters((current) => ({ ...current, [column]: value }));
                        }}
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
                {!visibleRecords.length ? (
                  <tr>
                    <td colSpan={columns.length + 1}>No records match the selected filters.</td>
                  </tr>
                ) : (
                  visibleRecords.map((row, index) => {
                    const id = rowId(row, resource.idField);
                    return (
                      <tr key={id ?? index}>
                        {columns.map((column) => (
                          <td key={column}>{String(row[column] ?? '—')}</td>
                        ))}
                        <td>
                          <div className="master-actions">
                            {id && (
                              <Link
                                className="master-action view"
                                to={`${resource.basePath}/View?id=${id}`}
                              >
                                <VisibilityOutlinedIcon fontSize="small" /> View
                              </Link>
                            )}
                            {id && (
                              <Link
                                className="master-action edit"
                                to={`${resource.basePath}/Edit?id=${id}`}
                              >
                                <EditOutlinedIcon fontSize="small" /> Edit
                              </Link>
                            )}
                            {id && (
                              <button
                                className="master-action delete"
                                onClick={() => {
                                  remove.reset();
                                  setDeleting(row);
                                }}
                              >
                                <DeleteOutlineIcon fontSize="small" /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <nav
            className="toolbar pagination master-pagination"
            aria-label={`${resource.plural} pagination`}
          >
            <span>
              {totalRecords ? firstRecord + 1 : 0}–
              {Math.min(firstRecord + MASTER_PAGE_SIZE, totalRecords)} of {totalRecords} records ·
              Page {currentPage} of {totalPages}
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
        </>
      )}
      {deleting && (
        <section className="notice" role="alertdialog" aria-modal="false">
          <h2>Delete {resource.singular}?</h2>
          <p>This action cannot be undone.</p>
          {remove.isError && <ErrorState error={remove.error} />}
          <div className="master-actions">
            <button
              disabled={remove.isPending}
              onClick={() => {
                const id = rowId(deleting, resource.idField);
                if (id) remove.mutate(id);
              }}
            >
              {remove.isPending ? 'Deleting…' : 'Confirm delete'}
            </button>
            <button
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

function MasterRecord({
  resourceKey,
  mode,
}: {
  resourceKey: MasterResourceKey;
  mode: 'create' | 'edit' | 'view';
}) {
  const resource = masterDataResources[resourceKey];
  const [params] = useSearchParams();
  const id = mode === 'create' ? null : numberId(params.get('id'));
  const query = useQuery({
    queryKey: ['master-data', resource.key, id],
    enabled: mode !== 'create' && id !== null,
    queryFn: async ({ signal }) =>
      records((await request(resource.getPath(id!), { signal })).Result)[0],
  });
  if (mode !== 'create' && id === null)
    return <ErrorState error={new Error(`A valid ${resource.singular} ID is required.`)} />;
  if (mode !== 'create' && query.isPending) return <Loading />;
  if (mode !== 'create' && query.isError)
    return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  return (
    <section className="card master-data-page gateway-editor">
      <Link className="gateway-back" to={resource.basePath}>
        ← Back to {resource.plural.toLowerCase()}
      </Link>
      <h1>
        {mode === 'create'
          ? `Create ${resource.singular}`
          : mode === 'edit'
            ? `Edit ${resource.singular}`
            : `${resource.singular[0].toUpperCase()}${resource.singular.slice(1)} details`}
      </h1>
      <p className="gateway-subtitle">
        {mode === 'create'
          ? `Add a new ${resource.singular}.`
          : `${resource.singular[0].toUpperCase()}${resource.singular.slice(1)} #${id}`}
      </p>
      {mode === 'view' ? (
        <MasterDetails resourceKey={resourceKey} row={query.data} id={id!} />
      ) : (
        <MasterForm resourceKey={resourceKey} id={id} initial={query.data} />
      )}
    </section>
  );
}

function MasterDetails({
  resourceKey,
  row,
  id,
}: {
  resourceKey: MasterResourceKey;
  row?: Row;
  id: number;
}) {
  const resource = masterDataResources[resourceKey];
  if (!row) return <p>No {resource.singular} found.</p>;
  return (
    <>
      <dl className="master-details">
        {Object.entries(row).map(([key, value]) => (
          <div key={key}>
            <dt>{key.replace(/([a-z])([A-Z])/g, '$1 $2')}</dt>
            <dd>{String(value ?? '—')}</dd>
          </div>
        ))}
      </dl>
      <Link className="button" to={`${resource.basePath}/Edit?id=${id}`}>
        Edit {resource.singular}
      </Link>
    </>
  );
}

function MasterForm({
  resourceKey,
  id,
  initial,
}: {
  resourceKey: MasterResourceKey;
  id: number | null;
  initial?: Row;
}) {
  const resource = masterDataResources[resourceKey];
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const banks = useQuery({
    queryKey: ['master-data', 'bank', 'active-options'],
    enabled: resourceKey === 'paymentAccount',
    queryFn: async ({ signal }) => records((await MasterDataService.getActiveBanks(signal)).Result),
    retry: false,
  });
  const bankOptions = (banks.data ?? []).map(row => ({
    id: rowId(row, 'BankID'),
    name: String(row[Object.keys(row).find(key => key.toLowerCase() === 'bankname') ?? 'BankName'] ?? ''),
  })).filter(bank => bank.id !== null).sort((a, b) => a.name.localeCompare(b.name));
  const [bankId, setBankId] = useState(String(initial?.BankID ?? initial?.BankId ?? ''));
  const bankReady = resourceKey !== 'paymentAccount' ||
    (banks.isSuccess && bankOptions.some(bank => String(bank.id) === bankId));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !bankReady) return;
    setPending(true);
    setError(undefined);
    const data = new FormData(event.currentTarget);
    const body: Row = {};
    resource.fields.forEach((item) => {
      const value = data.get(item.name);
      body[item.name] = item.nullable && (value === null || value === '')
        ? null : item.type === 'number' ? Number(value) : String(value ?? '').trim();
    });
    if (id !== null) body[resource.idField] = id;
    try {
      await request(id === null ? resource.createPath : resource.updatePath, {
        method: 'POST',
        body,
      });
      await cache.invalidateQueries({ queryKey: ['master-data', resource.key] });
      navigate(resource.basePath, {
        state: {
          message: `${resource.singular[0].toUpperCase()}${resource.singular.slice(1)} ${id === null ? 'created' : 'updated'}.`,
        },
      });
    } catch (caught) {
      setError(caught);
      setPending(false);
    }
  }
  return (
    <form className="master-form" onSubmit={submit} aria-busy={pending}>
      <div className="gateway-section-heading">
        <span>01</span>
        <div>
          <h2>{id === null ? 'Master details' : 'Update details'}</h2>
          <p>Enter the values required by the MasterData API.</p>
        </div>
      </div>
      <div className="master-form-grid">
        {resource.fields.map((item) => (
          <label className="master-field" key={item.name}>
            {resourceKey === 'paymentAccount' && item.name === 'BankID' ? 'Bank' : item.label}
            {resourceKey === 'paymentAccount' && item.name === 'BankID' ? (
              <>
                <select name="BankID" required value={bankId} disabled={banks.isPending || banks.isError}
                  onChange={event => setBankId(event.target.value)}>
                  <option value="" disabled>{banks.isPending ? 'Loading banks...' : 'Select bank'}</option>
                  {bankId && !bankOptions.some(bank => String(bank.id) === bankId) &&
                    <option value={bankId} disabled>Current bank unavailable — select an active bank</option>}
                  {bankOptions.map(bank => <option key={bank.id} value={bank.id!}>{bank.name}</option>)}
                </select>
                {banks.isSuccess && !bankOptions.length && <small>No active banks available.</small>}
              </>
            ) : item.options ? (
              <select name={item.name} required={item.required}
                defaultValue={String(initial?.[item.name] ?? 1)}>
                {item.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : <input
              name={item.name}
              type={item.type || 'text'}
              step={item.type === 'number' ? 'any' : undefined}
              required={item.required}
              defaultValue={String(initial?.[item.name] ?? (item.name === 'Status' ? 1 : ''))}
            />}
          </label>
        ))}
      </div>
      {error !== undefined && <ErrorState error={error} />}
      {resourceKey === 'paymentAccount' && banks.isError && <ErrorState error={banks.error} retry={() => void banks.refetch()} />}
      <div className="master-form-actions">
        <button disabled={pending || !bankReady}>
          {pending
            ? 'Saving…'
            : id === null
              ? `Create ${resource.singular}`
              : `Save ${resource.singular}`}
        </button>
        <Link className="button secondary" to={resource.basePath}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
