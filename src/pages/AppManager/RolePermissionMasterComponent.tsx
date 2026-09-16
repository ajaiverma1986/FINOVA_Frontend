import CreatePanelDialog from './CreatePanelDialog';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { AppMgrService, type UpdateRolePermissionRequest } from '../../services/AppMgrService';
import { ErrorState, Loading } from '../../components/Status';
import '../Masters/MasterDataCrudPage.css';

type Row = Record<string, unknown>;
type Mode = 'create' | 'edit' | 'view' | null;
type SortState = { column: string; direction: 'asc' | 'desc' } | null;
type RolePermissionForm = UpdateRolePermissionRequest;

const columns = [
  'RolePermissionID',
  'RoleID',
  'RoleName',
  'PermissionID',
  'PermissionName',
  'StatusName',
];
const PAGE_SIZE = 20;
const emptyForm: RolePermissionForm = {
  RolePermissionID: 0,
  RoleID: 0,
  PermissionID: 0,
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
  return numberValue(value(row, 'RolePermissionID'));
}
function toForm(row: Row): RolePermissionForm {
  return {
    RolePermissionID: rowId(row),
    RoleID: numberValue(value(row, 'RoleID')),
    PermissionID: numberValue(value(row, 'PermissionID')),
    Status: numberValue(value(row, 'Status')),
  };
}

export default function RolePermissionMasterComponent() {
  const cache = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<RolePermissionForm>(emptyForm);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<unknown>();
  const [saving, setSaving] = useState(false);
  const list = useQuery({
    queryKey: ['role-permission-master', activeOnly],
    queryFn: async ({ signal }) =>
      records(
        (
          await (activeOnly
            ? AppMgrService.getActiveRolePermissions(signal)
            : AppMgrService.getAllRolePermissions(signal))
        ).Result,
      ),
    retry: false,
  });
  const roles = useQuery({
    queryKey: ['role-master', false],
    queryFn: async ({ signal }) => records((await AppMgrService.getAllRoles(signal)).Result),
    retry: false,
  });
  const permissions = useQuery({
    queryKey: ['permission-master', false],
    queryFn: async ({ signal }) => records((await AppMgrService.getAllPermissions(signal)).Result),
    retry: false,
  });
  const gridRows = useMemo(() => {
    const roleNames = new Map(
      (roles.data ?? []).map((row) => [numberValue(value(row, 'RoleID')), value(row, 'RoleName')]),
    );
    const permissionNames = new Map(
      (permissions.data ?? []).map((row) => [
        numberValue(value(row, 'PermissionID')),
        value(row, 'PermissionName'),
      ]),
    );
    return (list.data ?? []).map((row) => ({
      ...row,
      StatusName:
        value(row, 'StatusName') ??
        (String(value(row, 'Status')) === '1'
          ? 'Active'
          : String(value(row, 'Status')) === '0'
            ? 'Inactive'
            : undefined),
      RoleName: value(row, 'RoleName') ?? roleNames.get(numberValue(value(row, 'RoleID'))),
      PermissionName:
        value(row, 'PermissionName') ??
        permissionNames.get(numberValue(value(row, 'PermissionID'))),
    }));
  }, [list.data, roles.data, permissions.data]);
  const detail = useQuery({
    queryKey: ['role-permission-master', 'detail', selectedId],
    enabled: selectedId !== null && mode !== 'create',
    queryFn: async ({ signal }) =>
      records((await AppMgrService.getRolePermissionById(selectedId!, signal)).Result)[0],
    retry: false,
  });
  const remove = useMutation({
    mutationFn: (id: number) => AppMgrService.deleteRolePermission(id),
    onSuccess: async () => {
      setMode(null);
      setSelectedId(null);
      setMessage('Role permission deleted.');
      await cache.invalidateQueries({ queryKey: ['role-permission-master'] });
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
  function updateField<K extends keyof RolePermissionForm>(
    field: K,
    fieldValue: RolePermissionForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: fieldValue }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSaving(true);
    try {
      if (mode === 'create') {
        const { RoleID, PermissionID, Status } = form;
        await AppMgrService.createRolePermission({ RoleID, PermissionID, Status });
      } else await AppMgrService.updateRolePermission(form);
      setMessage(mode === 'create' ? 'Role permission created.' : 'Role permission updated.');
      setMode(null);
      setSelectedId(null);
      await cache.invalidateQueries({ queryKey: ['role-permission-master'] });
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
          <h1>Role Permission Master</h1>
        </div>
        <button type="button" onClick={() => open('create')}>
          Create role permission
        </button>
      </div>
      {error != null && <ErrorState error={error} />}
      {roles.isError && <ErrorState error={roles.error} retry={() => void roles.refetch()} />}
      {permissions.isError && (
        <ErrorState error={permissions.error} retry={() => void permissions.refetch()} />
      )}
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
            void permissions.refetch();
          }}
        >
          Refresh
        </button>
      </div>
      {!list.data.length ? (
        <p>No role permissions found.</p>
      ) : (
        <>
          <div className="master-table-wrap">
            <table aria-label="Role permissions">
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
                            title="View role permission"
                            aria-label="View role permission"
                            onClick={() => open('view', row)}
                          >
                            <VisibilityOutlinedIcon fontSize="small" /> View
                          </button>
                          <button
                            type="button"
                            className="master-action edit"
                            title="Edit role permission"
                            aria-label="Edit role permission"
                            onClick={() => open('edit', row)}
                          >
                            <EditOutlinedIcon fontSize="small" /> Edit
                          </button>
                          <button
                            type="button"
                            className="master-action delete"
                            disabled={remove.isPending}
                            title="Delete role permission"
                            aria-label="Delete role permission"
                            onClick={() => {
                              if (window.confirm('Delete this role permission?'))
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
              aria-label="Role permission pagination"
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
        <CreatePanelDialog create={mode === 'create'} view={mode === 'view'} title={mode === 'view' ? 'Role permission details' : 'Create role permission'} onClose={() => setMode(null)}><section className="card gateway-editor" aria-label={`${mode} role permission`}>{mode === 'create' && error != null && <ErrorState error={error} />}
          <button type="button" className="secondary" onClick={() => setMode(null)}>
            Close
          </button>
          <h2>
            {mode === 'create'
              ? 'Create role permission'
              : mode === 'edit'
                ? 'Update role permission'
                : 'Role permission details'}
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
                    Role permission ID
                    <input type="number" readOnly value={form.RolePermissionID} />
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
                  Permission ID
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={form.PermissionID}
                    onChange={(event) => updateField('PermissionID', Number(event.target.value))}
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
                {mode === 'create' ? 'Create role permission' : 'Update role permission'}
              </button>
            </form>
          )}
        </section></CreatePanelDialog>
      )}
    </section>
  );
}
