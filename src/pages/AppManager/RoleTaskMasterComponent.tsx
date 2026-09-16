import CreatePanelDialog from './CreatePanelDialog';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { AppMgrService, type UpdateRoleTaskRequest } from '../../services/AppMgrService';
import { ErrorState, Loading } from '../../components/Status';
import '../Masters/MasterDataCrudPage.css';

type Row = Record<string, unknown>;
type Mode = 'create' | 'edit' | 'view' | null;
type SortState = { column: string; direction: 'asc' | 'desc' } | null;
type RoleTaskForm = UpdateRoleTaskRequest;

const columns = [
  'RoleTaskID',
  'RoleID',
  'RoleName',
  'TaskID',
  'TaskName',
  'ModuleName',
  'TAT',
  'StatusName',
];
const PAGE_SIZE = 20;
const emptyForm: RoleTaskForm = {
  RoleTaskID: 0,
  RoleID: 0,
  TaskID: 0,
  TAT: '',
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
  return matchingKey ? row[matchingKey] : undefined;
}
function numberValue(item: unknown) {
  const result = Number(item);
  return Number.isFinite(result) ? result : 0;
}
function rowId(row: Row) {
  return numberValue(value(row, 'RoleTaskID'));
}
function toForm(row: Row): RoleTaskForm {
  return {
    RoleTaskID: rowId(row),
    RoleID: numberValue(value(row, 'RoleID')),
    TaskID: numberValue(value(row, 'TaskID')),
    TAT: String(value(row, 'TAT') ?? ''),
    Status: numberValue(value(row, 'Status')),
  };
}

export default function RoleTaskMasterComponent() {
  const cache = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<RoleTaskForm>(emptyForm);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<unknown>();
  const [saving, setSaving] = useState(false);
  const list = useQuery({
    queryKey: ['role-task-master', activeOnly],
    queryFn: async ({ signal }) =>
      records(
        (
          await (activeOnly
            ? AppMgrService.getActiveRoleTasks(signal)
            : AppMgrService.getAllRoleTasks(signal))
        ).Result,
      ),
    retry: false,
  });
  const roles = useQuery({
    queryKey: ['role-master', false],
    queryFn: async ({ signal }) => records((await AppMgrService.getAllRoles(signal)).Result),
    retry: false,
  });
  const tasks = useQuery({
    queryKey: ['task-master', false],
    queryFn: async ({ signal }) => records((await AppMgrService.getAllTasks(signal)).Result),
    retry: false,
  });
  const modules = useQuery({
    queryKey: ['module-master', false],
    queryFn: async ({ signal }) => records((await AppMgrService.getAllModules(signal)).Result),
    retry: false,
  });
  const gridRows = useMemo(() => {
    const taskRecords = new Map(
      (tasks.data ?? []).map((row) => [numberValue(value(row, 'TaskID')), row]),
    );
    const moduleNames = new Map(
      (modules.data ?? []).map((row) => [
        numberValue(value(row, 'ModuleID')),
        value(row, 'ModuleName'),
      ]),
    );
    const roleNames = new Map(
      (roles.data ?? []).map((row) => [numberValue(value(row, 'RoleID')), value(row, 'RoleName')]),
    );
    const taskNames = new Map(
      (tasks.data ?? []).map((row) => [numberValue(value(row, 'TaskID')), value(row, 'TaskName')]),
    );
    return (list.data ?? []).map((row) => ({
      ...row,
      ModuleName:
        value(row, 'ModuleName') ??
        value(taskRecords.get(numberValue(value(row, 'TaskID'))) ?? {}, 'ModuleName') ??
        moduleNames.get(
          numberValue(
            value(row, 'ModuleID') ??
              value(taskRecords.get(numberValue(value(row, 'TaskID'))) ?? {}, 'ModuleID'),
          ),
        ),
      StatusName:
        value(row, 'StatusName') ??
        (String(value(row, 'Status')) === '1'
          ? 'Active'
          : String(value(row, 'Status')) === '0'
            ? 'Inactive'
            : undefined),
      RoleName: value(row, 'RoleName') ?? roleNames.get(numberValue(value(row, 'RoleID'))),
      TaskName: value(row, 'TaskName') ?? taskNames.get(numberValue(value(row, 'TaskID'))),
    }));
  }, [list.data, roles.data, tasks.data, modules.data]);
  const detail = useQuery({
    queryKey: ['role-task-master', 'detail', selectedId],
    enabled: selectedId !== null && mode !== 'create',
    queryFn: async ({ signal }) =>
      records((await AppMgrService.getRoleTaskById(selectedId!, signal)).Result)[0],
    retry: false,
  });
  const remove = useMutation({
    mutationFn: (id: number) => AppMgrService.deleteRoleTask(id),
    onSuccess: async () => {
      setMode(null);
      setSelectedId(null);
      setMessage('Role task deleted.');
      await cache.invalidateQueries({ queryKey: ['role-task-master'] });
    },
    onError: setError,
  });
  useEffect(() => {
    if (mode === 'create') setForm(emptyForm);
    if (mode === 'edit' && detail.data) setForm(toForm(detail.data));
  }, [detail.data, mode]);
  useEffect(() => setPage(1), [activeOnly, list.data]);
  const visibleRows = useMemo(() => {
    const filtered = gridRows.filter((row) =>
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
  }, [filters, gridRows, sort]);
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
  function updateField<K extends keyof RoleTaskForm>(field: K, fieldValue: RoleTaskForm[K]) {
    setForm((current) => ({ ...current, [field]: fieldValue }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSaving(true);
    try {
      if (mode === 'create') {
        const { RoleID, TaskID, TAT, Status } = form;
        await AppMgrService.createRoleTask({ RoleID, TaskID, TAT, Status });
      } else await AppMgrService.updateRoleTask(form);
      setMessage(mode === 'create' ? 'Role task created.' : 'Role task updated.');
      setMode(null);
      setSelectedId(null);
      await cache.invalidateQueries({ queryKey: ['role-task-master'] });
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
          <p className="eyebrow">Access Manager</p>
          <h1>Role Task Master</h1>
        </div>
        <button type="button" onClick={() => open('create')}>
          Create role task
        </button>
      </div>
      {error != null && <ErrorState error={error} />}
      {modules.isError && <ErrorState error={modules.error} retry={() => void modules.refetch()} />}
      {roles.isError && <ErrorState error={roles.error} retry={() => void roles.refetch()} />}
      {tasks.isError && <ErrorState error={tasks.error} retry={() => void tasks.refetch()} />}
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
        <button
          className="secondary"
          type="button"
          onClick={() => {
            void list.refetch();
            void roles.refetch();
            void tasks.refetch();
            void modules.refetch();
          }}
        >
          Refresh
        </button>
      </div>
      {!list.data.length ? (
        <p>No role tasks found.</p>
      ) : (
        <>
          <div className="master-table-wrap">
            <table aria-label="Role tasks">
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
                            title="View role task"
                            aria-label="View role task"
                            onClick={() => open('view', row)}
                          >
                            <VisibilityOutlinedIcon fontSize="small" /> View
                          </button>
                          <button
                            type="button"
                            className="master-action edit"
                            title="Edit role task"
                            aria-label="Edit role task"
                            onClick={() => open('edit', row)}
                          >
                            <EditOutlinedIcon fontSize="small" /> Edit
                          </button>
                          <button
                            type="button"
                            className="master-action delete"
                            disabled={remove.isPending}
                            title="Delete role task"
                            aria-label="Delete role task"
                            onClick={() => {
                              if (window.confirm('Delete this role task?'))
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
            <nav className="toolbar pagination master-pagination" aria-label="Role task pagination">
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
        <CreatePanelDialog create={mode === 'create'} view={mode === 'view'} title={mode === 'view' ? 'Role task details' : 'Create role task'} onClose={() => setMode(null)}><section className="card gateway-editor" aria-label={`${mode} role task`}>{mode === 'create' && error != null && <ErrorState error={error} />}
          <button type="button" className="secondary" onClick={() => setMode(null)}>
            Close
          </button>
          <h2>
            {mode === 'create'
              ? 'Create role task'
              : mode === 'edit'
                ? 'Update role task'
                : 'Role task details'}
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
              <div className="master-form-grid">
                {mode === 'edit' && (
                  <label className="master-field">
                    Role task ID
                    <input type="number" readOnly value={form.RoleTaskID} />
                  </label>
                )}
                <label className="master-field">
                  Role ID
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={form.RoleID}
                    onChange={(event) => updateField('RoleID', Number(event.target.value))}
                  />
                </label>
                <label className="master-field">
                  Task ID
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={form.TaskID}
                    onChange={(event) => updateField('TaskID', Number(event.target.value))}
                  />
                </label>
                <label className="master-field">
                  TAT
                  <input
                    required
                    value={form.TAT}
                    onChange={(event) => updateField('TAT', event.target.value)}
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
                {mode === 'create' ? 'Create role task' : 'Update role task'}
              </button>
            </form>
          )}
        </section></CreatePanelDialog>
      )}
    </section>
  );
}
