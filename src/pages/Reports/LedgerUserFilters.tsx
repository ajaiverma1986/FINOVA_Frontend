import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserMgrService } from '../../services/UserMgrservice';
import { useAuth } from '../../core/auth';
import { value, records } from '../Wallet/payinRequests';

function rowValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const match = value(row, key);
    if (match !== undefined && match !== null && match !== '') return match;
  }
  return undefined;
}

function userLabel(row: Record<string, unknown>) {
  const name = ['FirstName', 'MiddleName', 'LastName']
    .map((key) => String(value(row, key) ?? '').trim())
    .filter(Boolean)
    .join(' ');
  const username = String(value(row, 'UserName') ?? '').trim();
  const displayName =
    String(
      rowValue(row, ['DisplayName', 'Name', 'FullName', 'Description', 'Label']) ?? '',
    ).trim() ||
    String(value(row, 'UserName') ?? '').trim() ||
    String(value(row, 'Code') ?? '').trim();
  return (
    `${name}${username ? ` [${username}]` : ''}`.trim() ||
    displayName ||
    `User ${userMasterId(row) || 'unknown'}`
  );
}

function userMasterId(row: Record<string, unknown>) {
  const raw = rowValue(row, [
    'UserMasterID',
    'UserMasterId',
    'UserID',
    'UserId',
    'Id',
    'ID',
    'Value',
    'Code',
  ]);
  const parsed = Number(raw ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parentId(row: Record<string, unknown>) {
  const raw = rowValue(row, [
    'ParentId',
    'ParentID',
    'ParentUserMasterId',
    'ParentUserMasterID',
    'ParentUserId',
    'ParentUserID',
    'ParentCode',
    'MdsId',
    'MDSId',
    'MdsID',
    'DSId',
    'DSID',
  ]);
  const parsed = Number(raw ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function LedgerUserFilters({ onChange }: { onChange: (id: string) => void }) {
  const { session } = useAuth();
  const [mdsId, setMdsId] = useState('');
  const [dsId, setDsId] = useState('');
  const [agentId, setAgentId] = useState('');
  const currentUserTypeId = session?.userTypeId ?? 0;
  const currentUserName = session?.username ?? '';
  const currentUser = useQuery({
    queryKey: ['ledger-report-user', currentUserName],
    enabled: !!currentUserName,
    queryFn: async ({ signal }) => {
      const response = await UserMgrService.getUserMasterByUserName(currentUserName, signal);
      const result = response?.Result;
      if (Array.isArray(result)) return (result[0] ?? {}) as Record<string, unknown>;
      if (result && typeof result === 'object') return result as Record<string, unknown>;
      return {} as Record<string, unknown>;
    },
    retry: false,
  });
  const masterDistributors = useQuery({
    queryKey: ['ledger-report-mds'],
    enabled: !!session,
    queryFn: async ({ signal }) => {
      try {
        if (typeof UserMgrService.getParentCodeList === 'function') {
          const response = await UserMgrService.getParentCodeList(3, signal);
          const rows = records(response.Result);
          if (rows.length) return rows;
        }
      } catch {
        // fall through to the legacy user hierarchy lookup below
      }
      return records((await UserMgrService.getUserMastersByUserTypeId(3, signal)).Result);
    },
    retry: false,
  });
  const distributorUsers = useQuery({
    queryKey: ['ledger-report-ds', mdsId, currentUserTypeId],
    enabled: !!session && (currentUserTypeId === 5 || !!mdsId),
    queryFn: async ({ signal }) => {
      try {
        if (currentUserTypeId === 5 && typeof UserMgrService.getParentCodeList === 'function') {
          const response = await UserMgrService.getParentCodeList(4, signal);
          const rows = records(response.Result);
          if (rows.length) return rows;
        }
      } catch {
        // fall through to the legacy parent lookup below
      }
      const response = await UserMgrService.getUsersByParentId(Number(mdsId), 4, signal);
      return records(response.Result);
    },
    retry: false,
  });
  const retailerUsers = useQuery({
    queryKey: ['ledger-report-agent', dsId],
    enabled: !!dsId && !!session,
    queryFn: async ({ signal }) =>
      records((await UserMgrService.getUsersByParentId(Number(dsId), 5, signal)).Result),
    retry: false,
  });
  const applyMdsSelection = (nextMdsId: string) => {
    setMdsId(nextMdsId);
    setDsId('');
    setAgentId('');
  };
  const applyDsSelection = (nextDsId: string) => {
    setDsId(nextDsId);
    setAgentId('');
    const selectedDistributor = (distributorUsers.data ?? []).find(
      (row) => userMasterId(row as Record<string, unknown>) === Number(nextDsId),
    );
    if (selectedDistributor) {
      const nextParentId = parentId(selectedDistributor as Record<string, unknown>);
      if (nextParentId) setMdsId(String(nextParentId));
    }
  };
  const applyAgentSelection = (nextAgentId: string) => {
    setAgentId(nextAgentId);
    const selectedAgent = (retailerUsers.data ?? []).find(
      (row) => userMasterId(row as Record<string, unknown>) === Number(nextAgentId),
    );
    if (!selectedAgent) return;
    const nextDsId = String(parentId(selectedAgent as Record<string, unknown>) || '');
    if (nextDsId) {
      setDsId(nextDsId);
      const selectedDistributor = (distributorUsers.data ?? []).find(
        (row) => userMasterId(row as Record<string, unknown>) === Number(nextDsId),
      );
      if (selectedDistributor) {
        const nextMdsId = String(parentId(selectedDistributor as Record<string, unknown>) || '');
        if (nextMdsId) setMdsId(nextMdsId);
      }
    }
  };
  useEffect(() => {
    if (!currentUser.isSuccess || !currentUser.data) return;
    const record = currentUser.data as Record<string, unknown>;
    const currentUserMasterId = Number(
      rowValue(record, ['UserMasterID', 'UserMasterId', 'UserID', 'UserId']) ?? 0,
    );
    const userTypeId = Number(rowValue(record, ['UserTypeId', 'UserTypeID']) ?? 0);
    const parentValue = rowValue(record, [
      'ParentId',
      'ParentID',
      'ParentUserMasterId',
      'ParentUserMasterID',
      'MdsId',
      'MDSId',
      'DsId',
      'DSId',
    ]);
    const parent = Number(parentValue ?? 0);
    if (userTypeId === 3) setMdsId(currentUserMasterId ? String(currentUserMasterId) : '');
    else if (userTypeId === 4) {
      setDsId(currentUserMasterId ? String(currentUserMasterId) : '');
      setMdsId(parent ? String(parent) : '');
    } else if (userTypeId === 5) {
      setAgentId(currentUserMasterId ? String(currentUserMasterId) : '');
      setDsId(parent ? String(parent) : '');
      if (parent) {
        const selectedDistributor = distributorUsers.data ?? [];
        const parentMatch = selectedDistributor.find(
          (row) => userMasterId(row as Record<string, unknown>) === parent,
        );
        if (parentMatch) {
          const nextMdsId = parentId(parentMatch as Record<string, unknown>);
          if (nextMdsId) setMdsId(String(nextMdsId));
        }
      }
    }
  }, [currentUser.data, currentUser.isSuccess, distributorUsers.data]);

  useEffect(() => {
    onChange(agentId);
  }, [agentId, onChange]);
  return (
    <>
      {currentUserTypeId !== 5 && (
        <>
          <label className="master-field">
            MDS
            <select
              value={mdsId}
              disabled={currentUserTypeId === 3 || currentUserTypeId === 4}
              onChange={(event) => applyMdsSelection(event.target.value)}
            >
              <option value="">Select MDS</option>
              {records(masterDistributors.data ?? []).map((row) => {
                const rowId = String(userMasterId(row as Record<string, unknown>));
                return (
                  <option key={rowId} value={rowId}>
                    {userLabel(row as Record<string, unknown>)}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="master-field">
            DS
            <select
              value={dsId}
              disabled={currentUserTypeId === 4 || !mdsId}
              onChange={(event) => applyDsSelection(event.target.value)}
            >
              <option value="">Select DS</option>
              {records(distributorUsers.data ?? []).map((row) => {
                const rowId = String(userMasterId(row as Record<string, unknown>));
                return (
                  <option key={rowId} value={rowId}>
                    {userLabel(row as Record<string, unknown>)}
                  </option>
                );
              })}
            </select>
          </label>
        </>
      )}
      <label className="master-field">
        Retailer / Agent
        <select
          value={agentId}
          disabled={currentUserTypeId === 5 || !dsId}
          onChange={(event) => applyAgentSelection(event.target.value)}
        >
          <option value="">Select retailer / agent</option>
          {records(retailerUsers.data ?? []).map((row) => {
            const rowId = String(userMasterId(row as Record<string, unknown>));
            return (
              <option key={rowId} value={rowId}>
                {userLabel(row as Record<string, unknown>)}
              </option>
            );
          })}
        </select>
      </label>
    </>
  );
}
