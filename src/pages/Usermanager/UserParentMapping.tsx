import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorState, Loading } from '../../components/Status';
import { UserMgrService } from '../../services/UserMgrservice';
import { fieldValue, recordId, rows, type Row } from './userWizardData';

function label(row: Row) {
  const name = ['FirstName', 'MiddleName', 'LastName']
    .map((key) => String(fieldValue(row, key) ?? '').trim())
    .filter(Boolean)
    .join(' ');
  const username = String(fieldValue(row, 'UserName') ?? '').trim();
  return (
    `${name}${username ? `[${username}]` : ''}` ||
    String(fieldValue(row, 'DisplayName') ?? '').trim() ||
    `User ${recordId(row, 'UserMasterID')}`
  );
}

export default function UserParentMapping({
  userId,
  userTypeId,
  userTypeName,
  active,
  onSaving,
  onFinish,
}: {
  userId: number;
  userTypeId: number;
  userTypeName?: string;
  active: boolean;
  onSaving: (saving: boolean) => void;
  onFinish: () => void;
}) {
  const cache = useQueryClient();
  const [masterId, setMasterId] = useState('');
  const [distributorId, setDistributorId] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  const retailer =
    userTypeId === 5 ||
    ['retailer', 'retailor'].includes((userTypeName ?? '').trim().toLowerCase());
  const detail = useQuery({
    queryKey: ['user-wizard', userId, 'parent-mapping'],
    enabled: active && !initialized,
    queryFn: async ({ signal }) =>
      rows((await UserMgrService.getUserMasterById(userId, signal)).Result)[0],
    retry: false,
  });
  const masters = useQuery({
    queryKey: ['user-parent-options', 3],
    enabled: active,
    queryFn: async ({ signal }) =>
      rows((await UserMgrService.getUserMastersByUserTypeId(3, signal)).Result),
    retry: false,
  });
  const existingDistributors = useQuery({
    queryKey: ['user-parent-options', 4],
    enabled: active && retailer,
    queryFn: async ({ signal }) =>
      rows((await UserMgrService.getUserMastersByUserTypeId(4, signal)).Result),
    retry: false,
  });
  const distributors = useQuery({
    queryKey: ['user-parent-options', 4, Number(masterId)],
    enabled: active && retailer && !!masterId,
    queryFn: async ({ signal }) =>
      rows((await UserMgrService.getUsersByParentId(Number(masterId), 4, signal)).Result),
    retry: false,
  });
  useEffect(() => {
    if (initialized || !detail.isSuccess || (retailer && !existingDistributors.isSuccess)) return;
    const parentId = recordId(detail.data ?? {}, 'ParentId');
    if (retailer) {
      const parent = (existingDistributors.data ?? []).find(
        (row) => recordId(row, 'UserMasterID') === parentId,
      );
      if (parent) {
        setMasterId(String(recordId(parent, 'ParentId') || ''));
        setDistributorId(String(parentId));
      }
    } else setMasterId(String(parentId || ''));
    setInitialized(true);
  }, [
    detail.data,
    detail.isSuccess,
    existingDistributors.data,
    existingDistributors.isSuccess,
    initialized,
    retailer,
  ]);
  const masterOptions = (masters.data ?? []).filter(
    (row) =>
      recordId(row, 'UserMasterID') > 0 &&
      recordId(row, 'UserMasterID') !== userId &&
      Number(fieldValue(row, 'UserTypeId')) === 3,
  );
  const distributorOptions = (distributors.data ?? []).filter(
    (row) =>
      recordId(row, 'UserMasterID') > 0 &&
      recordId(row, 'UserMasterID') !== userId &&
      (fieldValue(row, 'UserTypeId') == null || Number(fieldValue(row, 'UserTypeId')) === 4) &&
      (fieldValue(row, 'ParentId') == null || recordId(row, 'ParentId') === Number(masterId)),
  );
  const valid =
    masterOptions.some((row) => recordId(row, 'UserMasterID') === Number(masterId)) &&
    (!retailer ||
      distributorOptions.some((row) => recordId(row, 'UserMasterID') === Number(distributorId)));
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || !initialized || !valid) return;
    busy.current = true;
    setSaving(true);
    onSaving(true);
    setError(undefined);
    setMessage('');
    try {
      await UserMgrService.mapUserParent({
        userMasterID: userId,
        parentId: Number(retailer ? distributorId : masterId),
      });
      await cache.invalidateQueries({ queryKey: ['user-master'] });
      await cache.invalidateQueries({ queryKey: ['user-parent-options'] });
      await cache.invalidateQueries({ queryKey: ['user-wizard', userId, 'parent-mapping'] });
      setMessage('Parent mapping saved.');
      onFinish();
    } catch (caught) {
      setError(caught);
    } finally {
      busy.current = false;
      setSaving(false);
      onSaving(false);
    }
  }
  if (!active) return null;
  const failed = [
    detail,
    masters,
    ...(retailer ? [existingDistributors, ...(masterId ? [distributors] : [])] : []),
  ].filter((query) => query.isError);
  if (failed.length)
    return (
      <>
        {failed.map((query, index) => (
          <ErrorState key={index} error={query.error} retry={() => void query.refetch()} />
        ))}
      </>
    );
  if (!initialized || masters.isPending) return <Loading />;
  return (
    <form className="master-form" onSubmit={save}>
      <fieldset className="user-step-fields" disabled={saving}>
        <div className="master-form-grid">
          <label className="master-field">
            Master Distributor *
            <select
              required
              value={masterId}
              onChange={(event) => {
                setMasterId(event.target.value);
                setDistributorId('');
                setMessage('');
              }}
            >
              <option value="">Select Master Distributor</option>
              {masterId &&
                !masterOptions.some(
                  (row) => recordId(row, 'UserMasterID') === Number(masterId),
                ) && (
                  <option value={masterId} disabled>
                    Current parent unavailable — select a Master Distributor
                  </option>
                )}
              {masterOptions.map((row) => (
                <option key={recordId(row, 'UserMasterID')} value={recordId(row, 'UserMasterID')}>
                  {label(row)}
                </option>
              ))}
            </select>
            {!masterOptions.length && <small>No Master Distributors available.</small>}
          </label>
          {retailer && (
            <label className="master-field">
              Distributor *
              <select
                required
                value={distributorId}
                disabled={!masterId || distributors.isPending}
                onChange={(event) => {
                  setDistributorId(event.target.value);
                  setMessage('');
                }}
              >
                <option value="">
                  {!masterId
                    ? 'Select Master Distributor first'
                    : distributors.isPending
                      ? 'Loading Distributors...'
                      : 'Select Distributor'}
                </option>
                {distributorOptions.map((row) => (
                  <option key={recordId(row, 'UserMasterID')} value={recordId(row, 'UserMasterID')}>
                    {label(row)}
                  </option>
                ))}
              </select>
              {masterId && distributors.isSuccess && !distributorOptions.length && (
                <small>No Distributors belong to this Master Distributor.</small>
              )}
            </label>
          )}
        </div>
      </fieldset>
      {error != null && <ErrorState error={error} />}
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      <div className="master-form-actions">
        <button type="submit" disabled={saving || !valid}>
          {saving ? 'Saving...' : 'Save and finish'}
        </button>
        <button type="button" className="secondary" disabled={saving} onClick={onFinish}>
          Close
        </button>
      </div>
    </form>
  );
}
