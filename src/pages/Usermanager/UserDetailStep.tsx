import MaskedIdentifierInput, { maskIdentifier } from './MaskedIdentifierInput';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ErrorState, Loading } from '../../components/Status';
import { detailSteps, fieldValue, recordId, rows, type Row } from './userWizardData';
import PincodeDataSelect from './PincodeDataSelect';
import { UserMgrService } from '../../services/UserMgrservice';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { MasterDataService } from '../../services/MasterDataService';

export default function UserDetailStep({
  index,
  userId,
  userTypeId,
  active,
  onPrevious,
  onNext,
  onSaving,
}: {
  index: number;
  userId: number;
  userTypeId?: number | null;
  active: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSaving: (saving: boolean) => void;
}) {
  const config = detailSteps[index];
  const hasGrid = index >= 0 && index <= 2;
  const recordName = index === 0 ? 'address' : index === 1 ? 'KYC' : 'bank account';
  const gridName = index === 0 ? 'Addresses' : index === 1 ? 'KYC records' : 'Bank accounts';
  const gridFields = config.fields.filter((field) => field.key !== 'PincodeDataId');
  const [form, setForm] = useState<Row>({ ...config.defaults });
  const [items, setItems] = useState<Row[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>();
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const companyId = (row: Row) => recordId(row, 'CompanyTypeId') || recordId(row, 'CompnayTypeId');
  const pendingCreate = useRef(false);
  const busy = useRef(false);
  const saveDestination = useRef(false);
  const detail = useQuery({
    queryKey: ['user-wizard', userId, config.id],
    enabled: active && !initialized,
    queryFn: async ({ signal }) => rows((await config.get(userId, signal)).Result),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const allTypes = useQuery({
    queryKey: ['user-wizard-lookup', config.id],
    enabled: active && !!config.lookup,
    queryFn: async ({ signal }) => rows((await config.lookup!.get(signal)).Result),
    retry: false,
  });
  const chargeTypes = useQuery({
    queryKey: ['user-configuration', 'charge-types'],
    enabled: active && index === 3,
    queryFn: async ({ signal }) =>
      rows((await MasterDataService.getActiveChargeDeductionTypes(signal)).Result),
    retry: false,
  });
  const plans = useQuery({
    queryKey: ['user-configuration', 'plans'],
    enabled: active && index === 3,
    queryFn: async ({ signal }) => rows((await MasterDataService.getActivePlans(signal)).Result),
    retry: false,
  });
  const configurationOptions: Record<string, { id: number; name: string }[]> = {
    ChargeTypeOn: (chargeTypes.data ?? [])
      .map((row) => ({
        id: recordId(row, 'ChargeDeductionId'),
        name: String(fieldValue(row, 'ChargeDeductionType') ?? ''),
      }))
      .filter((row) => row.id > 0),
    PlanId: (plans.data ?? [])
      .map((row) => ({
        id: recordId(row, 'PlanID'),
        name: String(fieldValue(row, 'PlanName') ?? ''),
      }))
      .filter((row) => row.id > 0),
    SameAmountPayinAllowed: [
      { id: 1, name: 'Yes' },
      { id: 2, name: 'No' },
    ],
  };
  const companies = useQuery({
    queryKey: ['user-wizard-company-types'],
    enabled: active && index === 1,
    queryFn: async ({ signal }) =>
      rows((await MasterDataService.getActiveCompanyTypes(signal)).Result),
    retry: false,
  });
  const existingType = (allTypes.data ?? []).find(
    (row) => recordId(row, 'KycTypeID') === Number(form.KycID),
  );
  const companyType = selectedCompany ?? companyId(existingType ?? {});
  const filteredTypes = useQuery({
    queryKey: ['user-wizard-kyc-types', userTypeId, companyType],
    enabled: active && index === 1 && companyType > 0 && !!userTypeId,
    queryFn: async ({ signal }) =>
      rows(
        (await MasterDataService.getKycTypesByUserTypeId(userTypeId!, companyType, signal)).Result,
      ),
    retry: false,
  });
  const lookup = index === 1 && companyType > 0 && userTypeId ? filteredTypes : allTypes;
  function populate(row?: Row) {
    setSelectedCompany(row ? companyId(row) || null : 0);
    const next = { ...config.defaults };
    for (const key of [...Object.keys(next), config.id]) {
      const value = row && fieldValue(row, key);
      if (value !== undefined) next[key] = value;
    }
    setForm(next);
    setError(undefined);
  }
  useEffect(() => {
    if (!initialized && detail.isSuccess && !detail.isFetching) {
      const found = detail.data.filter((row) => recordId(row, config.id));
      setItems(found);
      populate(found[0]);
      setInitialized(true);
    }
  }, [detail.data, detail.isSuccess, detail.isFetching, initialized]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current || !initialized) return;
    if (!pendingCreate.current)
      saveDestination.current =
        hasGrid && (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'stay';
    busy.current = true;
    setSaving(true);
    onSaving(true);
    setError(undefined);
    try {
      if (index === 3 && Number(form.MaxTxn) < Number(form.MinTxn)) {
        throw new Error('Maximum transaction must be at least the minimum transaction.');
      }
      let id = recordId(form, config.id);
      if (!pendingCreate.current) {
        const response = await config.save(form, userId, id);
        if (!id) {
          pendingCreate.current = true;
          id = recordId(response.Result, config.id);
        }
      }
      if (!id) {
        const refreshed = rows((await config.get(userId)).Result);
        const candidates = refreshed.filter(
          (row) =>
            recordId(row, config.id) &&
            !items.some((old) => recordId(old, config.id) === recordId(row, config.id)),
        );
        const matching = candidates.filter((row) =>
          config.fields.every(
            ({ key }) => String(fieldValue(row, key) ?? '') === String(form[key] ?? ''),
          ),
        );
        id = recordId(
          matching.length === 1 ? matching[0] : candidates.length === 1 ? candidates[0] : undefined,
          config.id,
        );
        if (!id)
          throw new Error(
            'The record was saved, but its ID could not be loaded. Retry to retrieve it without creating a duplicate.',
          );
      }
      const saved = {
        ...form,
        [config.id]: id,
        ...(index === 0 ? { Status: 1 } : {}),
        ...(index === 1 ? { CompanyTypeId: companyType } : {}),
      };
      setForm(saved);
      setItems((current) => [...current.filter((row) => recordId(row, config.id) !== id), saved]);
      pendingCreate.current = false;
      if (!saveDestination.current) onNext();
    } catch (caught) {
      setError(caught);
    } finally {
      busy.current = false;
      setSaving(false);
      onSaving(false);
    }
  }
  async function uploadDocument(file: File) {
    if (busy.current) return;
    setError(undefined);
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name) || file.size === 0 || file.size > 10 * 1024 * 1024) {
      setError(new Error('Select a PDF, JPG, or PNG document up to 10 MB.'));
      return;
    }
    busy.current = true;
    setUploading(true);
    setSaving(true);
    onSaving(true);
    try {
      const response = await UserMgrService.uploadUserKycFile(userId, file);
      const uploaded = response.Result;
      if (!uploaded?.FileUrl || !uploaded.MediaExtension || !uploaded.MediaContentType) {
        throw new Error('The upload did not return document details. Please retry.');
      }
      setForm((current) => ({ ...current, ...uploaded }));
    } catch (caught) {
      setError(caught);
    } finally {
      busy.current = false;
      setUploading(false);
      setSaving(false);
      onSaving(false);
    }
  }
  async function deleteRecord(id: number) {
    if (busy.current || pendingCreate.current || !window.confirm(`Delete this ${recordName}?`))
      return;
    busy.current = true;
    setSaving(true);
    onSaving(true);
    setError(undefined);
    try {
      if (index === 0) await UserMgrService.deleteUserAddress(id);
      else if (index === 1) await UserMgrService.deleteUserKyc(id);
      else if (index === 2) await UserMgrService.deleteUserBankAccount(id);
      setItems((current) => current.filter((row) => recordId(row, config.id) !== id));
      if (recordId(form, config.id) === id) populate();
    } catch (caught) {
      setError(caught);
    } finally {
      busy.current = false;
      setSaving(false);
      onSaving(false);
    }
  }
  if (!active) return null;
  const options = (lookup.data ?? [])
    .filter((row) => index !== 1 || !companyType || !!userTypeId || companyId(row) === companyType)
    .map((row) => ({
      id: recordId(row, config.lookup?.id ?? ''),
      name: String(fieldValue(row, config.lookup?.name ?? '') ?? ''),
    }))
    .filter((option) => option.id > 0);
  return (
    <form className="master-form" onSubmit={submit} aria-label={config.title}>
      <h3>{config.title}</h3>
      {!initialized && detail.isPending && <Loading />}
      {detail.isError && !initialized && (
        <ErrorState error={detail.error} retry={() => void detail.refetch()} />
      )}
      {config.lookup && lookup.isError && (
        <ErrorState error={lookup.error} retry={() => void lookup.refetch()} />
      )}
      {index === 1 && companies.isError && (
        <ErrorState error={companies.error} retry={() => void companies.refetch()} />
      )}
      {error != null && <ErrorState error={error} />}
      {index === 3 &&
        [chargeTypes, plans].map(
          (query, key) =>
            query.isError && (
              <ErrorState key={key} error={query.error} retry={() => void query.refetch()} />
            ),
        )}
      {initialized && (
        <fieldset disabled={saving || pendingCreate.current} className="user-step-fields">
          {hasGrid && (
            <button type="button" className="secondary" onClick={() => populate()}>
              Add {recordName}
            </button>
          )}
          {!hasGrid && !!items.length && (
            <label className="master-field">
              Record to edit
              <select
                value={recordId(form, config.id) || ''}
                onChange={(event) =>
                  populate(
                    items.find((row) => recordId(row, config.id) === Number(event.target.value)),
                  )
                }
              >
                <option value="">Add new {config.title.toLowerCase()}</option>
                {items.map((row) => (
                  <option key={recordId(row, config.id)} value={recordId(row, config.id)}>
                    {config.title} #{recordId(row, config.id)}
                    {index === 4
                      ? ` ? ${maskIdentifier(String(fieldValue(row, 'Pancard') ?? ''))}`
                      : config.fields.find(
                            ({ key }) =>
                              typeof fieldValue(row, key) === 'string' && fieldValue(row, key),
                          )
                        ? ` — ${String(fieldValue(row, config.fields.find(({ key }) => typeof fieldValue(row, key) === 'string' && fieldValue(row, key))!.key))}`
                        : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="master-form-grid">
            {index === 1 && (
              <label className="master-field">
                Company type
                <select
                  required
                  value={companyType || ''}
                  disabled={!companies.isSuccess}
                  onChange={(event) => {
                    setSelectedCompany(Number(event.target.value));
                    setForm((current) => ({ ...current, KycID: 0 }));
                  }}
                >
                  <option value="">
                    {companies.isPending ? 'Loading...' : 'Select company type'}
                  </option>
                  {!!companyType &&
                    !(companies.data ?? []).some((row) => companyId(row) === companyType) && (
                      <option value={companyType}>Current selection ({companyType})</option>
                    )}
                  {(companies.data ?? [])
                    .filter((row) => companyId(row))
                    .map((row) => (
                      <option key={companyId(row)} value={companyId(row)}>
                        {String(fieldValue(row, 'CompanyTypeName') ?? '')}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {config.fields
              .filter(
                (field) =>
                  index !== 1 ||
                  !['FileUrl', 'MediaExtension', 'MediaContentType'].includes(field.key),
              )
              .map((field) => (
                <label className="master-field" key={field.key}>
                  {field.label}
                  {index === 4 && ['Pancard', 'AadharCard', 'GSTNo'].includes(field.key) ? (
                    <MaskedIdentifierInput
                      value={String(form[field.key] ?? '')}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, [field.key]: value }))
                      }
                    />
                  ) : index === 3 && configurationOptions[field.key] ? (
                    <select
                      required
                      value={Number(form[field.key]) || ''}
                      disabled={
                        field.key === 'ChargeTypeOn'
                          ? !chargeTypes.isSuccess
                          : field.key === 'PlanId'
                            ? !plans.isSuccess
                            : false
                      }
                      onChange={(event) =>
                        setForm({ ...form, [field.key]: Number(event.target.value) })
                      }
                    >
                      <option value="">Select {field.label.toLowerCase()}</option>
                      {field.key !== 'SameAmountPayinAllowed' &&
                        !!Number(form[field.key]) &&
                        !configurationOptions[field.key].some(
                          (option) => option.id === Number(form[field.key]),
                        ) && (
                          <option value={Number(form[field.key])}>
                            Current selection ({String(form[field.key])}) — unavailable
                          </option>
                        )}
                      {configurationOptions[field.key].map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  ) : index === 0 && field.key === 'PincodeDataId' ? (
                    <PincodeDataSelect
                      pincode={String(form.Pincode ?? '')}
                      value={Number(form.PincodeDataId) || 0}
                      onChange={(id) => setForm({ ...form, PincodeDataId: id })}
                    />
                  ) : config.lookup?.field === field.key ? (
                    <select
                      required
                      value={String(form[field.key] || '')}
                      disabled={!lookup.isSuccess || (index === 1 && !companyType)}
                      onChange={(event) =>
                        setForm({ ...form, [field.key]: Number(event.target.value) })
                      }
                    >
                      <option value="">
                        {index === 1 && !companyType
                          ? 'Select company type first'
                          : lookup.isPending
                            ? 'Loading...'
                            : `Select ${field.label.toLowerCase()}`}
                      </option>
                      {!!form[field.key] &&
                        !options.some((option) => option.id === Number(form[field.key])) && (
                          <option value={String(form[field.key])}>
                            Current selection ({String(form[field.key])}) — unavailable
                          </option>
                        )}
                      {options.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      required={field.required}
                      type={typeof config.defaults[field.key] === 'number' ? 'number' : 'text'}
                      min={field.required ? 1 : 0}
                      step={field.decimal ? 'any' : 1}
                      value={String(form[field.key] ?? '')}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          ...(field.key === 'Pincode' ? { PincodeDataId: 0 } : {}),
                          [field.key]:
                            typeof config.defaults[field.key] === 'number'
                              ? event.target.value === ''
                                ? ''
                                : Number(event.target.value)
                              : event.target.value,
                        })
                      }
                    />
                  )}
                </label>
              ))}
            {index === 1 && (
              <label className="master-field">
                Upload document
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) void uploadDocument(file);
                  }}
                />
                <small>PDF, JPG or PNG, up to 10 MB.</small>
                {uploading ? (
                  <span role="status">Uploading document...</span>
                ) : (
                  !!form.FileUrl && <small>Uploaded document: {String(form.FileUrl)}</small>
                )}
              </label>
            )}
          </div>
        </fieldset>
      )}
      {hasGrid && !pendingCreate.current && (
        <div className="address-save-actions">
          <button type="submit" value="stay" disabled={saving || !initialized || !lookup.isSuccess}>
            <SaveOutlinedIcon fontSize="small" />
            Save {recordName}
          </button>
        </div>
      )}
      <div className="master-form-actions">
        <button
          type="button"
          className="secondary"
          disabled={saving || pendingCreate.current}
          onClick={onPrevious}
        >
          Previous
        </button>
        <button
          type="submit"
          disabled={
            saving ||
            !initialized ||
            (!!config.lookup && !lookup.isSuccess) ||
            (index === 3 && (!chargeTypes.isSuccess || !plans.isSuccess))
          }
        >
          {saving
            ? 'Saving...'
            : pendingCreate.current
              ? 'Retry'
              : index === detailSteps.length - 1
                ? 'Save and finish'
                : 'Next'}
        </button>
      </div>
      {hasGrid && initialized && (
        <section aria-label={`Saved ${gridName.toLowerCase()}`}>
          <h3>
            Saved {gridName.toLowerCase()} ({items.length})
          </h3>
          <div className="master-table-wrap">
            <table aria-label={gridName}>
              <thead>
                <tr>
                  {gridFields.map((field) => (
                    <th key={field.key}>{field.label}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!items.length && (
                  <tr>
                    <td colSpan={gridFields.length + 1}>
                      No saved {gridName.toLowerCase()}. Fill in the form and select Save{' '}
                      {recordName}.
                    </td>
                  </tr>
                )}
                {items.map((row) => {
                  const id = recordId(row, config.id);
                  return (
                    <tr key={id}>
                      {gridFields.map((field) => (
                        <td key={field.key}>
                          {field.key === config.lookup?.field
                            ? (options.find(
                                (option) => option.id === Number(fieldValue(row, field.key)),
                              )?.name ??
                              String(
                                fieldValue(row, config.lookup.name) ??
                                  fieldValue(row, field.key) ??
                                  '',
                              ))
                            : String(fieldValue(row, field.key) ?? '')}
                        </td>
                      ))}
                      <td>
                        <div className="master-actions address-grid-actions">
                          <button
                            type="button"
                            className="master-action edit"
                            title={`Edit this ${recordName}`}
                            disabled={saving || pendingCreate.current}
                            aria-label={`Edit ${recordName} ${id}`}
                            onClick={() => populate(row)}
                          >
                            <EditOutlinedIcon fontSize="small" /> Edit
                          </button>
                          <button
                            type="button"
                            className="master-action delete"
                            title={`Delete this ${recordName}`}
                            disabled={saving || pendingCreate.current}
                            aria-label={`Delete ${recordName} ${id}`}
                            onClick={() => void deleteRecord(id)}
                          >
                            <DeleteOutlineIcon fontSize="small" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </form>
  );
}
