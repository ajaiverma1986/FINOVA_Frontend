import CreatePanelDialog from './CreatePanelDialog';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { AppMgrService, type UpdatePermissionRequest } from '../../services/AppMgrService';
import { ErrorState, Loading } from '../../components/Status';
import '../Masters/MasterDataCrudPage.css';

type Row = Record<string, unknown>;
type Mode = 'create' | 'edit' | 'view' | null;
type SortState = { column: string; direction: 'asc' | 'desc' } | null;
type PermissionForm = UpdatePermissionRequest;

const columns = ['PermissionID', 'PermissionName', 'PermissionDescription', 'StatusName'];
const pageSize = 20;
const emptyForm: PermissionForm = {
  PermissionID: 0,
  PermissionName: '',
  PermissionDescription: '',
  Status: 1,
};

function records(value: unknown): Row[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is Row => Boolean(item) && typeof item === 'object');
  }
  if (value && typeof value === 'object') {
    const nested = Object.values(value).find(Array.isArray);
    return nested ? records(nested) : [value as Row];
  }
  return [];
}

function getValue(row: Row, key: string) {
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
  return numberValue(getValue(row, 'PermissionID'));
}

function toForm(row: Row): PermissionForm {
  return {
    PermissionID: rowId(row),
    PermissionName: String(getValue(row, 'PermissionName') ?? ''),
    PermissionDescription: String(getValue(row, 'PermissionDescription') ?? ''),
    Status: numberValue(getValue(row, 'Status')),
  };
}

export default function PermissionMasterComponent() {
  const cache = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<PermissionForm>(emptyForm);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<unknown>();

  const list = useQuery({
    queryKey: ['permission-master', activeOnly],
    queryFn: async ({ signal }) =>
      records((await (activeOnly
        ? AppMgrService.getActivePermissions(signal)
        : AppMgrService.getAllPermissions(signal))).Result),
    retry: false,
  });
  const detail = useQuery({
    queryKey: ['permission-master', 'detail', selectedId],
    enabled: selectedId !== null && mode !== 'create',
    queryFn: async ({ signal }) =>
      records((await AppMgrService.getPermissionById(selectedId!, signal)).Result)[0],
    retry: false,
  });
  const remove = useMutation({
    mutationFn: (id: number) => AppMgrService.deletePermission(id),
    onSuccess: async () => {
      setMode(null);
      setSelectedId(null);
      setMessage('Permission deleted.');
      await cache.invalidateQueries({ queryKey: ['permission-master'] });
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
        return !filter || String(getValue(row, column) ?? '').toLocaleLowerCase().includes(filter);
      }),
    );
    const sorted = [...filtered];
    if (sort) {
      sorted.sort((left, right) => {
        const comparison = String(getValue(left, sort.column) ?? '').localeCompare(
          String(getValue(right, sort.column) ?? ''),
          undefined,
          { numeric: true, sensitivity: 'base' },
        );
        return sort.direction === 'asc' ? comparison : -comparison;
      });
    }
    return sorted;
  }, [filters, list.data, sort]);
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = visibleRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function open(nextMode: Exclude<Mode, null>, row?: Row) {
    setError(undefined);
    setMessage('');
    setMode(nextMode);
    setSelectedId(row ? rowId(row) || null : null);
    if (row && nextMode !== 'create') setForm(toForm(row));
  }

  function updateField<K extends keyof PermissionForm>(field: K, value: PermissionForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    try {
      if (mode === 'create') {
        const { PermissionID: _permissionId, ...createValues } = form;
        await AppMgrService.createPermission(createValues);
        setMessage('Permission created.');
      } else {
        await AppMgrService.updatePermission(form);
        setMessage('Permission updated.');
      }
      setMode(null);
      setSelectedId(null);
      await cache.invalidateQueries({ queryKey: ['permission-master'] });
    } catch (caught) {
      setError(caught);
    }
  }

  if (list.isPending) return <Loading />;
  if (list.isError) return <ErrorState error={list.error} retry={() => void list.refetch()} />;

  return (
    <section className="card master-data-page">
      <div className="page-heading">
        <div><p className="eyebrow">Access Manager</p><h1>Permission Master</h1></div>
        <button type="button" onClick={() => open('create')}>Create permission</button>
      </div>
      {message && <p className="notice success" role="status">{message}</p>}
      <div className="master-toolbar">
        <label><input type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)} /> Active only</label>
        <button className="secondary" type="button" onClick={() => void list.refetch()}>Refresh</button>
      </div>
      {!list.data.length ? <p>No permissions found.</p> : <>
        <div className="master-table-wrap"><table aria-label="Permissions"><thead><tr>
          {columns.map((column) => <th key={column} aria-sort={sort?.column === column ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button type="button" className="master-sort" onClick={() => { setPage(1); setSort((current) => current?.column === column ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { column, direction: 'asc' }); }}>{column}<span aria-hidden="true">{sort?.column === column ? (sort.direction === 'asc' ? ' ^' : ' v') : ' ^v'}</span></button></th>)}
          <th>Actions</th>
        </tr><tr className="master-filter-row">
          {columns.map((column) => <th key={column}><input type="search" placeholder="Filter" value={filters[column] ?? ''} aria-label={`Filter by ${column}`} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, [column]: event.target.value })); }} /></th>)}
          <th><button type="button" className="secondary master-clear-filters" disabled={!Object.values(filters).some(Boolean)} onClick={() => { setPage(1); setFilters({}); }}>Clear</button></th>
        </tr></thead><tbody>
          {!pagedRows.length ? <tr><td colSpan={columns.length + 1}>No records match the selected filters.</td></tr> : pagedRows.map((row, index) => <tr key={rowId(row) || index}>
            {columns.map((column) => <td key={column}>{String(getValue(row, column) ?? '-')}</td>)}
            <td><div className="master-actions">
              <button type="button" className="master-action view" title="View permission" aria-label="View permission" onClick={() => open('view', row)}><VisibilityOutlinedIcon fontSize="small" /> View</button>
              <button type="button" className="master-action edit" title="Edit permission" aria-label="Edit permission" onClick={() => open('edit', row)}><EditOutlinedIcon fontSize="small" /> Edit</button>
              <button type="button" className="master-action delete" title="Delete permission" aria-label="Delete permission" onClick={() => { if (window.confirm('Delete this permission?')) remove.mutate(rowId(row)); }}><DeleteOutlineIcon fontSize="small" /> Delete</button>
            </div></td>
          </tr>)}
        </tbody></table></div>
        {!!visibleRows.length && <nav className="toolbar pagination master-pagination" aria-label="Permission pagination"><span>{(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, visibleRows.length)} of {visibleRows.length} records - Page {currentPage} of {totalPages}</span><button type="button" className="secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><button type="button" className="secondary" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button></nav>}
      </>}
      {mode && <CreatePanelDialog create={mode === 'create'} view={mode === 'view'} title={mode === 'view' ? 'Permission details' : 'Create permission'} onClose={() => setMode(null)}><section className="card gateway-editor" aria-label={`${mode} permission`}>
        <button type="button" className="secondary" onClick={() => setMode(null)}>Close</button>
        <h2>{mode === 'create' ? 'Create permission' : mode === 'edit' ? 'Update permission' : 'Permission details'}</h2>
        {detail.isPending && mode !== 'create' ? <Loading /> : mode === 'view' ? <dl className="master-details">{Object.entries(detail.data ?? form).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value ?? '-')}</dd></div>)}</dl> : <form className="master-form" onSubmit={submit}>
          {error != null && <ErrorState error={error} />}
          <div className="master-form-grid">
            <label className="master-field">Permission ID<input type="number" required value={form.PermissionID} onChange={(event) => updateField('PermissionID', Number(event.target.value))} /></label>
            <label className="master-field">Permission name<input required value={form.PermissionName} onChange={(event) => updateField('PermissionName', event.target.value)} /></label>
            <label className="master-field">Description<textarea value={form.PermissionDescription} onChange={(event) => updateField('PermissionDescription', event.target.value)} /></label>
            <label className="master-field">Status<select value={form.Status} onChange={(event) => updateField('Status', Number(event.target.value))}><option value={1}>Active</option><option value={0}>Inactive</option></select></label>
          </div>
          <button type="submit">{mode === 'create' ? 'Create permission' : 'Update permission'}</button>
        </form>}
      </section></CreatePanelDialog>}
    </section>
  );
}