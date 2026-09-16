import CreatePanelDialog from './CreatePanelDialog';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { AppMgrService, type UpdateTaskRequest } from '../../services/AppMgrService';
import { ErrorState, Loading } from '../../components/Status';
import '../Masters/MasterDataCrudPage.css';

type Row = Record<string, unknown>;
type Mode = 'create' | 'edit' | 'view' | null;
type SortState = { column: string; direction: 'asc' | 'desc' } | null;
type TaskForm = UpdateTaskRequest;

const columns = ['TaskID', 'TaskName', 'TaskTooltip', 'EntityTypeID', 'TaskURI', 'StatusName'];
const PAGE_SIZE = 20;
const emptyForm: TaskForm = {
  TaskID: 0,
  TaskName: '',
  TaskTooltip: '',
  TaskDescription: '',
  EntityTypeID: 0,
  TaskURI: '',
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
  return numberValue(value(row, 'TaskID'));
}
function toForm(row: Row): TaskForm {
  return {
    TaskID: rowId(row),
    TaskName: String(value(row, 'TaskName') ?? ''),
    TaskTooltip: String(value(row, 'TaskTooltip') ?? ''),
    TaskDescription: String(value(row, 'TaskDescription') ?? ''),
    EntityTypeID: numberValue(value(row, 'EntityTypeID')),
    TaskURI: String(value(row, 'TaskURI') ?? ''),
    Status: numberValue(value(row, 'Status')),
  };
}

export default function TaskMasterComponent() {
  const cache = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<unknown>();
  const list = useQuery({
    queryKey: ['task-master', activeOnly],
    queryFn: async ({ signal }) =>
      records((await (activeOnly ? AppMgrService.getActiveTasks(signal) : AppMgrService.getAllTasks(signal))).Result),
    retry: false,
  });
  const detail = useQuery({
    queryKey: ['task-master', 'detail', selectedId],
    enabled: selectedId !== null && mode !== 'create',
    queryFn: async ({ signal }) => records((await AppMgrService.getTaskById(selectedId!, signal)).Result)[0],
    retry: false,
  });
  const remove = useMutation({
    mutationFn: (id: number) => AppMgrService.deleteTask(id),
    onSuccess: async () => {
      setMode(null);
      setSelectedId(null);
      setMessage('Task deleted.');
      await cache.invalidateQueries({ queryKey: ['task-master'] });
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
        return !filter || String(value(row, column) ?? '').toLocaleLowerCase().includes(filter);
      }),
    );
    const sorted = [...filtered];
    if (sort) {
      sorted.sort((left, right) => {
        const leftValue = value(left, sort.column);
        const rightValue = value(right, sort.column);
        const comparison = typeof leftValue === 'number' && typeof rightValue === 'number'
          ? leftValue - rightValue
          : String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, { numeric: true, sensitivity: 'base' });
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
  function updateField<K extends keyof TaskForm>(field: K, fieldValue: TaskForm[K]) {
    setForm((current) => ({ ...current, [field]: fieldValue }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    try {
      if (mode === 'create') await AppMgrService.createTask(form);
      else await AppMgrService.updateTask(form);
      setMessage(mode === 'create' ? 'Task created.' : 'Task updated.');
      setMode(null);
      setSelectedId(null);
      await cache.invalidateQueries({ queryKey: ['task-master'] });
    } catch (caught) {
      setError(caught);
    }
  }
  if (list.isPending) return <Loading />;
  if (list.isError) return <ErrorState error={list.error} retry={() => void list.refetch()} />;
  return (
    <section className="card master-data-page">
      <div className="page-heading"><div><p className="eyebrow">Access Manager</p><h1>Task Master</h1></div><button type="button" onClick={() => open('create')}>Create task</button></div>
      {message && <p className="notice success" role="status">{message}</p>}
      <div className="master-toolbar"><label><input type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)} /> Active only</label><button className="secondary" type="button" onClick={() => void list.refetch()}>Refresh</button></div>
      {!list.data.length ? <p>No tasks found.</p> : <>
        <div className="master-table-wrap"><table aria-label="Tasks"><thead><tr>{columns.map((column) => <th key={column} aria-sort={sort?.column === column ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button type="button" className="master-sort" onClick={() => { setPage(1); setSort((current) => current?.column === column ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { column, direction: 'asc' }); }}>{column}<span aria-hidden="true">{sort?.column === column ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span></button></th>)}<th>Actions</th></tr><tr className="master-filter-row">{columns.map((column) => <th key={column}><input type="search" placeholder="Filter" value={filters[column] ?? ''} aria-label={`Filter by ${column}`} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, [column]: event.target.value })); }} /></th>)}<th><button type="button" className="secondary master-clear-filters" disabled={!Object.values(filters).some(Boolean)} onClick={() => { setPage(1); setFilters({}); }}>Clear</button></th></tr></thead><tbody>{!pagedRows.length ? <tr><td colSpan={columns.length + 1}>No records match the selected filters.</td></tr> : pagedRows.map((row, index) => <tr key={rowId(row) || index}>{columns.map((column) => <td key={column}>{String(value(row, column) ?? '—')}</td>)}<td><div className="master-actions"><button type="button" className="master-action view" title="View task" aria-label="View task" onClick={() => open('view', row)}><VisibilityOutlinedIcon fontSize="small" /> View</button><button type="button" className="master-action edit" title="Edit task" aria-label="Edit task" onClick={() => open('edit', row)}><EditOutlinedIcon fontSize="small" /> Edit</button><button type="button" className="master-action delete" title="Delete task" aria-label="Delete task" onClick={() => { if (window.confirm('Delete this task?')) remove.mutate(rowId(row)); }}><DeleteOutlineIcon fontSize="small" /> Delete</button></div></td></tr>)}</tbody></table></div>
        {!!visibleRows.length && <nav className="toolbar pagination master-pagination" aria-label="Task pagination"><span>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, visibleRows.length)} of {visibleRows.length} records · Page {currentPage} of {totalPages}</span><button type="button" className="secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><button type="button" className="secondary" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button></nav>}
      </>}
      {mode && <CreatePanelDialog create={mode === 'create'} view={mode === 'view'} title={mode === 'view' ? 'Task details' : 'Create task'} onClose={() => setMode(null)}><section className="card gateway-editor" aria-label={`${mode} task`}><button type="button" className="secondary" onClick={() => setMode(null)}>Close</button><h2>{mode === 'create' ? 'Create task' : mode === 'edit' ? 'Update task' : 'Task details'}</h2>{detail.isPending && mode !== 'create' ? <Loading /> : mode === 'view' ? <dl className="master-details">{Object.entries(detail.data ?? form).map(([key, item]) => <div key={key}><dt>{key}</dt><dd>{String(item ?? '—')}</dd></div>)}</dl> : <form className="master-form" onSubmit={submit}>{error != null && <ErrorState error={error} />}<div className="master-form-grid"><label className="master-field">Task ID<input type="number" required value={form.TaskID} onChange={(event) => updateField('TaskID', Number(event.target.value))} /></label><label className="master-field">Task name<input required value={form.TaskName} onChange={(event) => updateField('TaskName', event.target.value)} /></label><label className="master-field">Tooltip<input value={form.TaskTooltip} onChange={(event) => updateField('TaskTooltip', event.target.value)} /></label><label className="master-field">Entity type ID<input type="number" required value={form.EntityTypeID} onChange={(event) => updateField('EntityTypeID', Number(event.target.value))} /></label><label className="master-field">Task URI<input required value={form.TaskURI} onChange={(event) => updateField('TaskURI', event.target.value)} /></label><label className="master-field">Description<textarea value={form.TaskDescription} onChange={(event) => updateField('TaskDescription', event.target.value)} /></label><label className="master-field">Status<select value={form.Status} onChange={(event) => updateField('Status', Number(event.target.value))}><option value={1}>Active</option><option value={0}>Inactive</option></select></label></div><button type="submit">{mode === 'create' ? 'Create task' : 'Update task'}</button></form>}</section></CreatePanelDialog>}
    </section>
  );
}
