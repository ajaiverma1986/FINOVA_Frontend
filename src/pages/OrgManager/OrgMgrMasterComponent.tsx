import CreatePanelDialog from '../AppManager/CreatePanelDialog';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { OrgMgrService, type UpdateOrganizationRequest } from '../../services/OrgMgrService';
import { ErrorState, Loading } from '../../components/Status';
import '../Masters/MasterDataCrudPage.css';

type Row = Record<string, unknown>;
type Mode = 'create' | 'edit' | 'view' | null;
type SortState = { column: string; direction: 'asc' | 'desc' } | null;
type OrganizationForm = UpdateOrganizationRequest;

const columns = [
  'OrganizationID',
  'OrganizationCode',
  'OrganizationName',
  'DisplayName',
  'OrganizationTypeID',
  'Email',
  'MobileNo',
  'StatusName',
];
const PAGE_SIZE = 20;
const emptyForm: OrganizationForm = {
  OrganizationID: 0,
  OrganizationCode: '',
  OrganizationName: '',
  DisplayName: '',
  LegalName: '',
  Email: '',
  MobileNo: '',
  PhoneNo: '',
  Website: '',
  RegistrationNo: '',
  GSTIN: '',
  PAN: '',
  TAN: '',
  LogoPath: '',
  OrganizationTypeID: null,
  CurrencyID: null,
  TimeZoneID: null,
  Status: 1,
};

function records(value: unknown): Row[] {
  if (Array.isArray(value))
    return value.filter((item): item is Row => Boolean(item) && typeof item === 'object');
  if (value && typeof value === 'object') {
    const nested = Object.values(value).find(Array.isArray);
    return nested ? records(nested) : [value as Row];
  }
  return [];
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
function numberValue(item: unknown) {
  const result = Number(item);
  return Number.isFinite(result) ? result : 0;
}
function rowId(row: Row) {
  return numberValue(value(row, 'OrganizationID'));
}
function toForm(row: Row): OrganizationForm {
  return {
    OrganizationID: rowId(row),
    OrganizationCode: String(value(row, 'OrganizationCode') ?? ''),
    OrganizationName: String(value(row, 'OrganizationName') ?? ''),
    DisplayName: String(value(row, 'DisplayName') ?? ''),
    LegalName: String(value(row, 'LegalName') ?? ''),
    Email: String(value(row, 'Email') ?? ''),
    MobileNo: String(value(row, 'MobileNo') ?? ''),
    PhoneNo: String(value(row, 'PhoneNo') ?? ''),
    Website: String(value(row, 'Website') ?? ''),
    RegistrationNo: String(value(row, 'RegistrationNo') ?? ''),
    GSTIN: String(value(row, 'GSTIN') ?? ''),
    PAN: String(value(row, 'PAN') ?? ''),
    TAN: String(value(row, 'TAN') ?? ''),
    LogoPath: String(value(row, 'LogoPath') ?? ''),
    OrganizationTypeID:
      value(row, 'OrganizationTypeID') == null
        ? null
        : numberValue(value(row, 'OrganizationTypeID')),
    CurrencyID: value(row, 'CurrencyID') == null ? null : numberValue(value(row, 'CurrencyID')),
    TimeZoneID: value(row, 'TimeZoneID') == null ? null : numberValue(value(row, 'TimeZoneID')),
    Status: numberValue(value(row, 'Status')),
  };
}

export default function OrgMgrMasterComponent() {
  const cache = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<OrganizationForm>(emptyForm);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<unknown>();
  const [saving, setSaving] = useState(false);
  const list = useQuery({
    queryKey: ['organization-master', activeOnly],
    queryFn: async ({ signal }) =>
      records(
        (
          await (activeOnly
            ? OrgMgrService.getActiveOrganizations(signal)
            : OrgMgrService.getAllOrganizations(signal))
        ).Result,
      ),
    retry: false,
  });
  const detail = useQuery({
    queryKey: ['organization-master', 'detail', selectedId],
    enabled: selectedId !== null && mode !== 'create',
    queryFn: async ({ signal }) =>
      records((await OrgMgrService.getOrganizationById(selectedId!, signal)).Result)[0],
    retry: false,
  });
  const remove = useMutation({
    mutationFn: (id: number) => OrgMgrService.deleteOrganization(id),
    onSuccess: async () => {
      setMode(null);
      setSelectedId(null);
      setMessage('Organization deleted.');
      await cache.invalidateQueries({ queryKey: ['organization-master'] });
    },
    onError: setError,
  });
  useEffect(() => {
    if (mode === 'create') setForm(emptyForm);
    if (mode === 'edit' && detail.data) setForm(toForm(detail.data));
  }, [detail.data, mode]);
  useEffect(() => setPage(1), [activeOnly, list.data]);
  const visibleRows = useMemo(() => {
    const filtered = (list.data ?? []).filter((row) =>
      columns.every((column) => {
        const filter = filters[column]?.trim().toLocaleLowerCase();
        return (
          !filter ||
          String(value(row, column) ?? '')
            .toLocaleLowerCase()
            .includes(filter)
        );
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

  function open(nextMode: Exclude<Mode, null>, row?: Row) {
    setError(undefined);
    setMessage('');
    setMode(nextMode);
    const id = row ? rowId(row) : null;
    setSelectedId(id || null);
    if (row && nextMode !== 'create') setForm(toForm(row));
  }
  function updateField<K extends keyof OrganizationForm>(
    field: K,
    fieldValue: OrganizationForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: fieldValue }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    if (saving) return;
    setSaving(true);
    try {
      if (mode === 'create') {
        const { OrganizationID: _id, ...values } = form;
        await OrgMgrService.createOrganization(values);
      } else await OrgMgrService.updateOrganization(form);
      setMessage(mode === 'create' ? 'Organization created.' : 'Organization updated.');
      setMode(null);
      setSelectedId(null);
      await cache.invalidateQueries({ queryKey: ['organization-master'] });
    } catch (caught) {
      setError(caught);
    } finally {
      setSaving(false);
    }
  }
  if (list.isPending) return <Loading />;
  if (list.isError) return <ErrorState error={list.error} retry={() => void list.refetch()} />;
  return (
    <section className="card master-data-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Organization Manager</p>
          <h1>Organization Master</h1>
        </div>
        <button type="button" onClick={() => open('create')}>
          Create organization
        </button>
      </div>
      {!mode && error != null && <ErrorState error={error} />}
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
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
        <p>No organizations found.</p>
      ) : (
        <>
          <div className="master-table-wrap">
            <table aria-label="Organizations">
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
                      <button
                        type="button"
                        className="master-sort"
                        onClick={() => {
                          setPage(1);
                          setSort((current) =>
                            current?.column === column
                              ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
                              : { column, direction: 'asc' },
                          );
                        }}
                      >
                        {column}
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
                        placeholder="Filter"
                        value={filters[column] ?? ''}
                        aria-label={`Filter by ${column}`}
                        onChange={(event) => {
                          setPage(1);
                          setFilters((current) => ({ ...current, [column]: event.target.value }));
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
                {!pagedRows.length ? (
                  <tr>
                    <td colSpan={columns.length + 1}>No records match the selected filters.</td>
                  </tr>
                ) : (
                  pagedRows.map((row, index) => (
                    <tr key={rowId(row) || index}>
                      {columns.map((column) => (
                        <td key={column}>{String(value(row, column) ?? '—')}</td>
                      ))}
                      <td>
                        <div className="master-actions">
                          <button
                            type="button"
                            className="master-action view"
                            title="View organization"
                            aria-label="View organization"
                            onClick={() => open('view', row)}
                          >
                            <VisibilityOutlinedIcon fontSize="small" /> View
                          </button>
                          <button
                            type="button"
                            className="master-action edit"
                            title="Edit organization"
                            aria-label="Edit organization"
                            onClick={() => open('edit', row)}
                          >
                            <EditOutlinedIcon fontSize="small" /> Edit
                          </button>
                          <button
                            type="button"
                            className="master-action delete"
                            disabled={remove.isPending}
                            title="Delete organization"
                            aria-label="Delete organization"
                            onClick={() => {
                              if (window.confirm('Delete this organization?'))
                                remove.mutate(rowId(row));
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!!visibleRows.length && (
            <nav
              className="toolbar pagination master-pagination"
              aria-label="Organization pagination"
            >
              <span>
                {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, visibleRows.length)} of {visibleRows.length}{' '}
                records · Page {currentPage} of {totalPages}
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
        </>
      )}
      {mode && (
        <CreatePanelDialog
          create={mode === 'create'} view={mode === 'view'}
          title={mode === 'view' ? 'Organization details' : 'Create organization'}
          onClose={() => setMode(null)}
        >
          <section className="card gateway-editor" aria-label={`${mode} organization`}>
            <button type="button" className="secondary" onClick={() => setMode(null)}>
              Close
            </button>
            <h2>
              {mode === 'create'
                ? 'Create organization'
                : mode === 'edit'
                  ? 'Update organization'
                  : 'Organization details'}
            </h2>
            {detail.isError && mode !== 'create' ? (
              <ErrorState error={detail.error} retry={() => void detail.refetch()} />
            ) : detail.isPending && mode !== 'create' ? (
              <Loading />
            ) : mode === 'view' ? (
              <dl className="master-details">
                {Object.entries(detail.data ?? form).map(([key, item]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{String(item ?? '—')}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <form className="master-form" onSubmit={submit}>
                {error != null && <ErrorState error={error} />}
                <div className="master-form-grid">
                  {mode === 'edit' && (
                    <label className="master-field">
                      Organization ID
                      <input readOnly value={form.OrganizationID} />
                    </label>
                  )}
                  <label className="master-field">
                    Organization code
                    <input
                      type="text"
                      value={form.OrganizationCode ?? ''}
                      onChange={(event) => updateField('OrganizationCode', event.target.value)}
                    />
                  </label>
                  <label className="master-field">
                    Organization name
                    <input
                      type="text"
                      required
                      value={form.OrganizationName ?? ''}
                      onChange={(event) => updateField('OrganizationName', event.target.value)}
                    />
                  </label>
                  <label className="master-field">
                    Display name
                    <input
                      type="text"
                      value={form.DisplayName ?? ''}
                      onChange={(event) => updateField('DisplayName', event.target.value)}
                    />
                  </label>
                  <label className="master-field">
                    Legal name
                    <input
                      type="text"
                      value={form.LegalName ?? ''}
                      onChange={(event) => updateField('LegalName', event.target.value)}
                    />
                  </label>
                  <label className="master-field">
                    Email
                    <input
                      type="email"
                      value={form.Email ?? ''}
                      onChange={(event) => updateField('Email', event.target.value)}
                    />
                  </label>
                  <label className="master-field">
                    Mobile number
                    <input
                      type="text"
                      value={form.MobileNo ?? ''}
                      onChange={(event) => updateField('MobileNo', event.target.value)}
                    />
                  </label>
                  <label className="master-field">
                    Phone number
                    <input
                      type="text"
                      value={form.PhoneNo ?? ''}
                      onChange={(event) => updateField('PhoneNo', event.target.value)}
                    />
                  </label>
                  <label className="master-field">
                    Website
                    <input
                      type="text"
                      value={form.Website ?? ''}
                      onChange={(event) => updateField('Website', event.target.value)}
                    />
                  </label>
                  <label className="master-field">
                    Registration number
                    <input
                      type="text"
                      value={form.RegistrationNo ?? ''}
                      onChange={(event) => updateField('RegistrationNo', event.target.value)}
                    />
                  </label>
                  <label className="master-field">
                    GSTIN
                    <input
                      type="text"
                      value={form.GSTIN ?? ''}
                      onChange={(event) => updateField('GSTIN', event.target.value)}
                    />
                  </label>
                  <label className="master-field">
                    PAN
                    <input
                      type="text"
                      value={form.PAN ?? ''}
                      onChange={(event) => updateField('PAN', event.target.value)}
                    />
                  </label>
                  <label className="master-field">
                    TAN
                    <input
                      type="text"
                      value={form.TAN ?? ''}
                      onChange={(event) => updateField('TAN', event.target.value)}
                    />
                  </label>
                  <label className="master-field">
                    Logo path
                    <input
                      type="text"
                      value={form.LogoPath ?? ''}
                      onChange={(event) => updateField('LogoPath', event.target.value)}
                    />
                  </label>
                  <label className="master-field">
                    Organization type ID
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={form.OrganizationTypeID ?? ''}
                      onChange={(event) =>
                        updateField(
                          'OrganizationTypeID',
                          event.target.value === '' ? null : Number(event.target.value),
                        )
                      }
                    />
                  </label>
                  <label className="master-field">
                    Currency ID
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={form.CurrencyID ?? ''}
                      onChange={(event) =>
                        updateField(
                          'CurrencyID',
                          event.target.value === '' ? null : Number(event.target.value),
                        )
                      }
                    />
                  </label>
                  <label className="master-field">
                    Time zone ID
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={form.TimeZoneID ?? ''}
                      onChange={(event) =>
                        updateField(
                          'TimeZoneID',
                          event.target.value === '' ? null : Number(event.target.value),
                        )
                      }
                    />
                  </label>
                  <label className="master-field">
                    Status
                    <select
                      value={form.Status}
                      onChange={(event) => updateField('Status', Number(event.target.value))}
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </label>
                </div>
                <button type="submit" disabled={saving}>
                  {mode === 'create' ? 'Create organization' : 'Update organization'}
                </button>
              </form>
            )}
          </section>
        </CreatePanelDialog>
      )}
    </section>
  );
}

