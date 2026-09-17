import UserDetailStep from './UserDetailStep';
import { detailSteps, recordId } from './userWizardData';
import './UserWizard.css';
import CreatePanelDialog from '../AppManager/CreatePanelDialog';
import UserAccountActions from './UserAccountActions';
import { MasterDataService } from '../../services/MasterDataService';
import { OrgMgrService } from '../../services/OrgMgrService';
import { exportToExcel } from '../../core/exportToExcel';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  UserMgrService,
  type CreateUserMasterRequest,
  type UpdateUserMasterRequest,
} from '../../services/UserMgrservice';
import { ErrorState, Loading } from '../../components/Status';
import '../Masters/MasterDataCrudPage.css';

type Row = Record<string, unknown>;
type Mode = 'create' | 'edit' | 'view' | null;
type SortState = { column: string; direction: 'asc' | 'desc' } | null;
type UserForm = UpdateUserMasterRequest &
  Omit<CreateUserMasterRequest, keyof UpdateUserMasterRequest>;

const columns = [
  'UserMasterID',
  'UserName',
  'FirstName',
  'LastName',
  'OrganizationName',
  'UserTypeName',
  'EmailId',
  'MobileNo',
  'StatusName',
];
const PAGE_SIZE = 20;
const emptyForm: UserForm = {
  UserMasterID: 0,
  UserTypeId: null,
  OrganizationID: 0,
  UserName: '',
  Password: '',
  Title: '',
  FirstName: '',
  MiddleName: '',
  LastName: '',
  GenderID: 0,
  IsPasswordExpired: false,
  UserId: 0,
  IsLocked: false,
  LockedTill: null,
  Status: 8,
  EmailId: '',
  MobileNo: '',
  RemarkReason: '',
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
  return numberValue(value(row, 'UserMasterID'));
}
function toForm(row: Row): UserForm {
  const result = { ...emptyForm };
  for (const key of Object.keys(result) as (keyof UserForm)[]) {
    const item = value(row, key);
    if (item !== undefined && key !== 'Password') Object.assign(result, { [key]: item });
  }
  return result;
}

export default function UserMasterComponent() {
  const cache = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(false);
  const [searchKind, setSearchKind] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState({ kind: 'all', text: '' });
  const [mode, setMode] = useState<Mode>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<unknown>();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [wizardNotice, setWizardNotice] = useState('');
  const created = useRef(false);
  const submitting = useRef(false);
  const lookupEnabled = mode === 'create' || mode === 'edit';
  const userTypes = useQuery({
    queryKey: ['user-master-lookups', 'active-user-types'],
    enabled: lookupEnabled,
    queryFn: async ({ signal }) =>
      records((await MasterDataService.getActiveUserTypes(signal)).Result),
    retry: false,
  });
  const organizations = useQuery({
    queryKey: ['user-master-lookups', 'active-organizations'],
    enabled: lookupEnabled,
    queryFn: async ({ signal }) =>
      records((await OrgMgrService.getActiveOrganizations(signal)).Result),
    retry: false,
  });
  const genders = useQuery({
    queryKey: ['user-master-lookups', 'genders'],
    enabled: lookupEnabled,
    queryFn: async ({ signal }) => records((await MasterDataService.GenderList({}, signal)).Result),
    retry: false,
  });
  const lookupsReady = userTypes.isSuccess && organizations.isSuccess && genders.isSuccess;
  function lookupField(
    field: 'UserTypeId' | 'OrganizationID' | 'GenderID',
    label: string,
    nameKey: string,
  ) {
    const lookup =
      field === 'UserTypeId' ? userTypes : field === 'OrganizationID' ? organizations : genders;
    const options = (lookup.data ?? [])
      .map((row) => ({
        id: numberValue(value(row, field)),
        name: String(value(row, nameKey) ?? value(row, 'Name') ?? value(row, field)),
      }))
      .filter((option) => option.id > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
    const current = form[field];
    return (
      <label className="master-field">
        {label}
        <select
          value={current || ''}
          disabled={lookup.isPending}
          required={field !== 'UserTypeId'}
          onChange={(event) =>
            updateField(
              field,
              event.target.value ? Number(event.target.value) : field === 'UserTypeId' ? null : 0,
            )
          }
        >
          <option value="">
            {lookup.isPending ? 'Loading...' : `Select ${label.toLowerCase()}`}
          </option>
          {!!current && !options.some((option) => option.id === current) && (
            <option value={current}>Current selection ({current}) — unavailable</option>
          )}
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {lookup.isSuccess && !options.length && (
          <small>No {label.toLowerCase()} options available.</small>
        )}
      </label>
    );
  }
  function close() {
    if (saving) return;
    setMode(null);
    setSelectedId(null);
    setForm(emptyForm);
    setStep(0);
    setWizardNotice('');
    created.current = false;
    void cache.invalidateQueries({ queryKey: ['user-master'] });
    cache.removeQueries({ queryKey: ['user-wizard'] });
  }
  const list = useQuery({
    queryKey: ['user-master', 'list', activeOnly, search],
    queryFn: async ({ signal }) => {
      const response =
        search.kind === 'organization'
          ? await UserMgrService.getUserMastersByOrganizationId(Number(search.text), signal)
          : search.kind === 'type'
            ? await UserMgrService.getUserMastersByUserTypeId(Number(search.text), signal)
            : search.kind === 'name'
              ? await UserMgrService.getUserMasterByUserName(search.text, signal)
              : activeOnly
                ? await UserMgrService.getActiveUserMasters(signal)
                : await UserMgrService.getAllUserMasters(signal);
      return records(response.Result).filter(
        (row) => !activeOnly || search.kind === 'all' || Number(value(row, 'Status')) === 1,
      );
    },
    retry: false,
  });
  const detail = useQuery({
    queryKey: ['user-master', 'detail', selectedId],
    enabled: selectedId !== null && (mode === 'edit' || mode === 'view'),
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) =>
      records((await UserMgrService.getUserMasterById(selectedId!, signal)).Result)[0],
    retry: false,
  });
  const remove = useMutation({
    mutationFn: (id: number) => UserMgrService.deleteUserMaster(id),
    onSuccess: async () => {
      setMode(null);
      setSelectedId(null);
      setMessage('User deleted.');
      await cache.invalidateQueries({ queryKey: ['user-master'] });
    },
    onError: setError,
  });
  useEffect(() => {
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
    setWizardNotice('');
    setError(undefined);
    setMessage('');
    setStep(0);
    created.current = false;
    if (nextMode === 'create') setForm(emptyForm);
    setMode(nextMode);
    const id = row ? rowId(row) : null;
    setSelectedId(id || null);
    if (row && nextMode !== 'create') setForm(toForm(row));
  }
  function updateField<K extends keyof UserForm>(field: K, fieldValue: UserForm[K]) {
    setForm((current) => ({ ...current, [field]: fieldValue }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !lookupsReady) return;
    submitting.current = true;
    setSaving(true);
    setError(undefined);
    try {
      const { UserMasterID, Password, IsPasswordExpired, UserId, IsLocked, LockedTill, ...shared } =
        form;
      let id = UserMasterID;
      if (id) {
        await UserMgrService.updateUserMaster({ ...shared, UserMasterID: id });
      } else {
        if (!created.current) {
          const existing = records(
            (await UserMgrService.getUserMasterByUserName(form.UserName ?? '')).Result,
          ).filter(
            (row) =>
              rowId(row) &&
              String(value(row, 'UserName')).toLowerCase() === String(form.UserName).toLowerCase(),
          );
          if (existing.length > 1)
            throw new Error(
              'More than one user matches this name. Open the intended user using Edit.',
            );
          if (existing.length === 1) {
            const existingId = rowId(existing[0]);
            const full = records((await UserMgrService.getUserMasterById(existingId)).Result)[0];
            if (!full)
              throw new Error('The existing user details could not be loaded. Please retry.');
            setForm(toForm({ ...full, UserMasterID: existingId }));
            setWizardNotice(
              'This user already exists. Details have been loaded; review them and click Next to update.',
            );
            return;
          }
          if (!Password) throw new Error('Enter a password for the new user.');
          const response = await UserMgrService.createUserMaster({
            ...shared,
            Status: 8,
            Password,
            IsPasswordExpired: false,
            UserId: 0,
            IsLocked: false,
            LockedTill: null,
          });
          created.current = true;
          id = recordId(response.Result, 'UserMasterID');
        }
        if (!id) {
          const found = records(
            (await UserMgrService.getUserMasterByUserName(form.UserName ?? '')).Result,
          ).filter(
            (row) =>
              String(value(row, 'UserName')).toLowerCase() === String(form.UserName).toLowerCase(),
          );
          if (found.length === 1) id = rowId(found[0]);
        }
        if (!id)
          throw new Error(
            'User saved, but the user ID could not be loaded. Click Next to retry without creating another user.',
          );
        setForm((current) => ({ ...current, UserMasterID: id, Password: '' }));
      }
      setStep(1);
      setWizardNotice('');
    } catch (caught) {
      setError(caught);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  if (list.isPending) return <Loading />;
  return (
    <section className="card master-data-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">User Manager</p>
          <h1>User Master</h1>
        </div>
        <button type="button" onClick={() => open('create')}>
          Create user
        </button>
      </div>
      {error != null && !mode && <ErrorState error={error} />}
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
        <button
          type="button"
          className="secondary"
          disabled={!visibleRows.length || list.isError}
          onClick={() =>
            exportToExcel(
              'User Masters',
              columns,
              visibleRows.map((row) =>
                Object.fromEntries(columns.map((column) => [column, value(row, column)])),
              ),
            )
          }
        >
          Export to Excel
        </button>
      </div>
      <form
        className="master-toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch({ kind: searchKind, text: searchText.trim() });
        }}
      >
        <label>
          Search by
          <select
            value={searchKind}
            onChange={(event) => {
              setSearchKind(event.target.value);
              setSearchText('');
            }}
          >
            <option value="all">All users</option>
            <option value="organization">Organization ID</option>
            <option value="type">User type ID</option>
            <option value="name">User name</option>
          </select>
        </label>
        {searchKind !== 'all' && (
          <label>
            Search value
            <input
              required
              type={searchKind === 'name' ? 'text' : 'number'}
              min={1}
              step={1}
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </label>
        )}
        <button type="submit">Search</button>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setSearchKind('all');
            setSearchText('');
            setSearch({ kind: 'all', text: '' });
          }}
        >
          Reset
        </button>
      </form>
      {list.isError ? (
        <ErrorState error={list.error} retry={() => void list.refetch()} />
      ) : !list.data?.length ? (
        <p>No users found.</p>
      ) : (
        <>
          <div className="master-table-wrap">
            <table aria-label="Users">
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
                          <UserAccountActions id={rowId(row)} />
                          <button
                            type="button"
                            className="master-action view"
                            title="View user"
                            aria-label="View user"
                            onClick={() => open('view', row)}
                          >
                            <VisibilityOutlinedIcon fontSize="small" /> View
                          </button>
                          <button
                            type="button"
                            className="master-action edit"
                            title="Edit user"
                            aria-label="Edit user"
                            onClick={() => open('edit', row)}
                          >
                            <EditOutlinedIcon fontSize="small" /> Edit
                          </button>
                          <button
                            type="button"
                            disabled={remove.isPending}
                            className="master-action delete"
                            title="Delete user"
                            aria-label="Delete user"
                            onClick={() => {
                              if (window.confirm('Delete this user?')) {
                                setError(undefined);
                                remove.mutate(rowId(row));
                              }
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
            <nav className="toolbar pagination master-pagination" aria-label="User pagination">
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
          create={mode === 'create'}
          view={mode === 'view'}
          edit={mode === 'edit'}
          title={mode === 'view' ? 'User details' : mode === 'edit' ? 'Update user' : 'Create user'}
          onClose={close}
        >
          <section className="card gateway-editor" aria-label={`${mode} user`}>
            <button type="button" className="secondary" disabled={saving} onClick={close}>
              Close
            </button>
            <h2>
              {mode === 'create' ? 'Create user' : mode === 'edit' ? 'Update user' : 'User details'}
            </h2>
            {mode !== 'view' && (
              <>
                <div className="user-wizard-progress" role="tablist" aria-label="User setup steps">
                  {['User', ...detailSteps.map((item) => item.title)].map((title, index) => (
                    <button
                      key={title}
                      type="button"
                      role="tab"
                      id={`user-setup-tab-${index}`}
                      aria-selected={step === index}
                      aria-controls="user-setup-panel"
                      tabIndex={step === index ? 0 : -1}
                      disabled={saving || (index > 0 && !form.UserMasterID)}
                      title={
                        index > 0 && !form.UserMasterID
                          ? 'Save the user first to open this tab'
                          : title
                      }
                      onClick={() => setStep(index)}
                      onKeyDown={(event) => {
                        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                        event.preventDefault();
                        const tabs = Array.from(
                          event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>(
                            '[role="tab"]:not(:disabled)',
                          ),
                        );
                        const current = tabs.indexOf(event.currentTarget);
                        const next =
                          event.key === 'Home'
                            ? 0
                            : event.key === 'End'
                              ? tabs.length - 1
                              : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) %
                                tabs.length;
                        tabs[next]?.focus();
                        tabs[next]?.click();
                      }}
                    >
                      <span className="user-tab-number" aria-hidden="true">
                        {index + 1}
                      </span>
                      {title}
                    </button>
                  ))}
                </div>
                {wizardNotice && (
                  <p className="notice" role="status">
                    {wizardNotice}
                  </p>
                )}
                <p className="user-wizard-hint">
                  Step {step + 1} of 6. Next saves this step. Switch tabs or use Previous to keep
                  editing without saving.
                  {!form.UserMasterID && ' Save the user first to unlock the other tabs.'}
                </p>
              </>
            )}
            <div
              id="user-setup-panel"
              role={mode !== 'view' ? 'tabpanel' : undefined}
              aria-labelledby={mode !== 'view' ? `user-setup-tab-${step}` : undefined}
            >
              {step === 0 &&
                (detail.isError && mode !== 'create' ? (
                  <ErrorState error={detail.error} retry={() => void detail.refetch()} />
                ) : detail.isPending && mode !== 'create' ? (
                  <Loading />
                ) : mode === 'view' ? (
                  <dl className="master-details">
                    {Object.entries(detail.data ?? form)
                      .filter(([key]) => !/password|token|salt/i.test(key))
                      .map(([key, item]) => (
                        <div key={key}>
                          <dt>{key}</dt>
                          <dd>{String(item ?? '—')}</dd>
                        </div>
                      ))}
                  </dl>
                ) : (
                  <form className="master-form" onSubmit={submit}>
                    {[userTypes, organizations, genders].map(
                      (lookup, index) =>
                        lookup.isError && (
                          <ErrorState
                            key={index}
                            error={lookup.error}
                            retry={() => void lookup.refetch()}
                          />
                        ),
                    )}
                    {error != null && <ErrorState error={error} />}
                    <fieldset
                      className="user-step-fields"
                      disabled={saving || (created.current && !form.UserMasterID)}
                    >
                      <div className="master-form-grid">
                        {lookupField('UserTypeId', 'User type', 'UserTypeName')}
                        {lookupField('OrganizationID', 'Organization', 'OrganizationName')}
                        <label className="master-field">
                          User Name
                          <input
                            type="text"
                            required
                            value={form.UserName ?? ''}
                            onChange={(event) => updateField('UserName', event.target.value)}
                          />
                        </label>
                        {!form.UserMasterID && !created.current && (
                          <label className="master-field">
                            Password
                            <input
                              type="password"
                              autoComplete="new-password"
                              value={form.Password ?? ''}
                              onChange={(event) => updateField('Password', event.target.value)}
                            />
                          </label>
                        )}
                        <label className="master-field">
                          Title
                          <input
                            type="text"
                            value={form.Title ?? ''}
                            onChange={(event) => updateField('Title', event.target.value)}
                          />
                        </label>
                        <label className="master-field">
                          First Name
                          <input
                            type="text"
                            value={form.FirstName ?? ''}
                            onChange={(event) => updateField('FirstName', event.target.value)}
                          />
                        </label>
                        <label className="master-field">
                          Middle Name
                          <input
                            type="text"
                            value={form.MiddleName ?? ''}
                            onChange={(event) => updateField('MiddleName', event.target.value)}
                          />
                        </label>
                        <label className="master-field">
                          Last Name
                          <input
                            type="text"
                            value={form.LastName ?? ''}
                            onChange={(event) => updateField('LastName', event.target.value)}
                          />
                        </label>
                        {lookupField('GenderID', 'Gender', 'GenderName')}

                        <label className="master-field">
                          Email Id
                          <input
                            type="email"
                            value={form.EmailId ?? ''}
                            onChange={(event) => updateField('EmailId', event.target.value)}
                          />
                        </label>
                        <label className="master-field">
                          Mobile No
                          <input
                            type="text"
                            value={form.MobileNo ?? ''}
                            onChange={(event) => updateField('MobileNo', event.target.value)}
                          />
                        </label>
                      </div>
                    </fieldset>
                    <div className="master-form-actions">
                      <button type="button" className="secondary" disabled>
                        Previous
                      </button>
                      <button type="submit" disabled={saving || !lookupsReady}>
                        {saving ? 'Saving...' : 'Next'}
                      </button>
                    </div>
                  </form>
                ))}
              {mode !== 'view' &&
                form.UserMasterID > 0 &&
                detailSteps.map((item, index) => (
                  <UserDetailStep
                    key={item.id}
                    index={index}
                    userId={form.UserMasterID}
                    userTypeId={form.UserTypeId}
                    active={step === index + 1}
                    onSaving={setSaving}
                    onPrevious={() => setStep(step - 1)}
                    onNext={() => {
                      if (index === detailSteps.length - 1) {
                        setMessage(
                          mode === 'create' ? 'User setup completed.' : 'User details updated.',
                        );
                        setMode(null);
                        setSelectedId(null);
                        setForm(emptyForm);
                        setStep(0);
                        created.current = false;
                        void cache.invalidateQueries({ queryKey: ['user-master'] });
                        void cache.removeQueries({ queryKey: ['user-wizard'] });
                      } else setStep(step + 1);
                    }}
                  />
                ))}
            </div>
          </section>
        </CreatePanelDialog>
      )}
    </section>
  );
}
