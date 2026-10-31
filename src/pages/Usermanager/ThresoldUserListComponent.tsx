import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { exportToExcel } from '../../core/exportToExcel';
import { ErrorState, Loading } from '../../components/Status';
import { UserMgrService } from '../../services/UserMgrservice';
import CreatePanelDialog from '../AppManager/CreatePanelDialog';

type Row = Record<string, unknown>;

const listRequest = {
  OrganizationID: 0,
  UserTypeId: 0,
  ParentId: 0,
  Status: 0,
  SearchText: '',
};

const columns = [
  { key: 'UserMasterID', label: 'User ID', aliases: ['UserMasterID', 'UserMasterId'] },
  { key: 'UserName', label: 'User Name', aliases: ['UserName', 'UserCode', 'Usercode'] },
  { key: 'FirstName', label: 'First Name', aliases: ['FirstName'] },
  { key: 'LastName', label: 'Last Name', aliases: ['LastName'] },
  { key: 'UserTypeName', label: 'User Type', aliases: ['UserTypeName', 'UserTypename'] },
  { key: 'MobileNo', label: 'Mobile No', aliases: ['MobileNo'] },
  { key: 'EmailId', label: 'Email', aliases: ['EmailId'] },
  { key: 'AvailableLimit', label: 'Available Limit', aliases: ['AvailableLimit'] },
  { key: 'ThresoldLimit', label: 'Band Limit', aliases: ['ThresoldLimit'] },
] as const;

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

function value(row: Row, keys: readonly string[]) {
  const name = Object.keys(row).find((key) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
  );
  return name === undefined ? '' : row[name];
}

function formatCurrency(amount: unknown) {
  const numericAmount = typeof amount === 'number' ? amount : Number(amount);
  return Number.isFinite(numericAmount) ? inrFormatter.format(numericAmount) : String(amount ?? '');
}

function rows(result: unknown): Row[] {
  if (Array.isArray(result))
    return result.filter((item): item is Row => !!item && typeof item === 'object');
  if (!result || typeof result !== 'object') return [];
  const collection = Object.values(result).find(Array.isArray);
  return collection ? rows(collection) : [result as Row];
}

export default function ThresoldUserListComponent() {
  const cache = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<Row | null>(null);
  const [limit, setLimit] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState('');

  const userList = useQuery({
    queryKey: ['threshold-user-list', appliedSearch],
    queryFn: async ({ signal }) =>
      rows(
        (
          await UserMgrService.getThresoldUserList(
            { ...listRequest, SearchText: appliedSearch },
            signal,
          )
        ).Result,
      ),
    retry: false,
  });

  function openLimitEditor(user: Row) {
    setSelectedUser(user);
    setLimit(String(value(user, ['ThresoldLimit']) ?? ''));
    setReason('');
    setError(undefined);
    setMessage('');
  }

  async function saveLimit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser || saving) return;
    const userMasterId = Number(value(selectedUser, ['UserMasterId', 'UserMasterID']));
    const thresholdLimit = Number(limit);
    if (!Number.isSafeInteger(userMasterId) || userMasterId <= 0) {
      setError(new Error('A valid user ID is not available for this record.'));
      return;
    }
    if (!Number.isFinite(thresholdLimit) || thresholdLimit < 0) {
      setError(new Error('Enter a valid non-negative band limit.'));
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      await UserMgrService.updateUserWalletThresoldLimit({
        UserMasterId: userMasterId,
        ThresoldLimit: thresholdLimit,
        ThresoldReason: reason.trim(),
      });
      await cache.invalidateQueries({ queryKey: ['threshold-user-list'] });
      setSelectedUser(null);
      setMessage('Band limit updated.');
    } catch (caught) {
      setError(caught);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card master-data-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">User Manager</p>
          <h1>Set Band Limit</h1>
        </div>
      </div>
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      <form
        className="master-toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedSearch(searchText.trim());
        }}
      >
        <label>
          Search users
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </label>
        <button type="submit">Search</button>
        <button
          className="secondary"
          type="button"
          onClick={() => void userList.refetch()}
          disabled={userList.isFetching}
        >
          Refresh
        </button>
        <button
          className="secondary"
          type="button"
          disabled={!userList.data?.length || userList.isError}
          onClick={() =>
            exportToExcel(
              'User Band Limits',
              columns.map((column) => column.label),
              (userList.data ?? []).map((row) =>
                Object.fromEntries(
                  columns.map((column) => {
                    const cell = value(row, column.aliases);
                    return [
                      column.label,
                      column.key === 'AvailableLimit' || column.key === 'ThresoldLimit'
                        ? formatCurrency(cell)
                        : cell,
                    ];
                  }),
                ),
              ),
            )
          }
        >
          <FileDownloadOutlinedIcon fontSize="small" /> Export to Excel
        </button>
      </form>
      {userList.isPending ? (
        <Loading />
      ) : userList.isError ? (
        <ErrorState error={userList.error} retry={() => void userList.refetch()} />
      ) : (
        <div className="master-table-wrap">
          <table aria-label="User band limits">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!userList.data.length ? (
                <tr>
                  <td colSpan={columns.length + 1}>No users found.</td>
                </tr>
              ) : (
                userList.data.map((row, index) => (
                  <tr key={String(value(row, ['UserMasterId', 'UserMasterID']) || index)}>
                    {columns.map((column) => {
                      const cell = value(row, column.aliases);
                      return (
                        <td key={column.key}>
                          {column.key === 'AvailableLimit' || column.key === 'ThresoldLimit'
                            ? formatCurrency(cell)
                            : String(cell ?? '')}
                        </td>
                      );
                    })}
                    <td>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => openLimitEditor(row)}
                        disabled={saving}
                      >
                        Set Band Limit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <CreatePanelDialog
          create
          title="Set Band Limit"
          onClose={() => {
            if (!saving) setSelectedUser(null);
          }}
        >
          <section className="card gateway-editor" aria-label="Set band limit">
            <h2 id="band-limit-title">Set Band Limit</h2>
            <p>
              {String(value(selectedUser, ['UserName', 'UserCode', 'Usercode']) || 'Selected user')}
            </p>
            <p>User Type: {String(value(selectedUser, ['UserTypeName', 'UserTypename']) || '—')}</p>
            <form className="master-form" onSubmit={(event) => void saveLimit(event)}>
              <label className="master-field">
                Band limit
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={limit}
                  onChange={(event) => setLimit(event.target.value)}
                />
              </label>
              <label className="master-field">
                Reason
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={500}
                />
              </label>
              {error != null && <ErrorState error={error} />}
              <div className="master-form-actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={saving}
                  onClick={() => setSelectedUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Band Limit'}
                </button>
              </div>
            </form>
          </section>
        </CreatePanelDialog>
      )}
    </section>
  );
}
