import { useMemo, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { DataTable, title, textValue } from '../../components/DataTable';
import { ErrorState, Loading } from '../../components/Status';
import FileViewer from '../../components/FileViewer';
import { value } from './payinRequests';
import CreatePanelDialog from '../AppManager/CreatePanelDialog';
import CompanyAccountFields, { readValues } from './CompanyAccountFields';
import {
  companyAccountOperations,
  companyAccountResources,
  type Values,
  type OperationKey,
  type CompanyAccountResource,
} from './companyAccountResources';
import '../Masters/MasterDataCrudPage.css';

type Row = Record<string, unknown>;
export function companyAccountRows(result: unknown): Row[] {
  if (Array.isArray(result))
    return result.filter((row): row is Row => !!row && typeof row === 'object');
  if (result && typeof result === 'object') {
    const nested = Object.values(result).find(Array.isArray);
    return nested ? companyAccountRows(nested) : [result as Row];
  }
  return [];
}
function recordId(row: Row, key: string) {
  const match = Object.keys(row).find((name) => name.toLowerCase() === key.toLowerCase());
  return Number(match ? row[match] : 0);
}

export default function CompanyAccountComponent() {
  const resourceKey = 'companyAccount';
  const resource = companyAccountResources[resourceKey];
  const cache = useQueryClient();
  const [searchOperation, setSearchOperation] = useState<OperationKey>(resource.list);
  const [search, setSearch] = useState<{ operation: OperationKey; values: Values }>({
    operation: resource.list,
    values: {},
  });
  const [editor, setEditor] = useState<{
    mode: 'create' | 'view' | 'edit' | 'delete';
    id: number;
  } | null>(null);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<Row | null>(null);
  const list = useQuery({
    queryKey: ['wallet-company-accounts', resourceKey, 'list', search],
    queryFn: async ({ signal }) =>
      companyAccountRows(
        (await companyAccountOperations[search.operation].run(search.values, signal)).Result,
      ),
    retry: false,
  });
  const gridRows = useMemo(() => {
    const hidden = new Set(resource.hiddenColumns?.map((column) => column.toLowerCase()));
    return list.data?.map((row) =>
      Object.fromEntries(
        Object.entries(row).filter(([column]) => !hidden.has(column.toLowerCase())),
      ),
    );
  }, [list.data, resource.hiddenColumns]);
  async function saved(message: string) {
    setEditor(null);
    setMessage(message);
    await cache.invalidateQueries({ queryKey: ['wallet-company-accounts', resourceKey] });
  }
  return (
    <section className="card master-data-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Wallet</p>
          <h1>{resource.title}</h1>
        </div>
        <button type="button" onClick={() => setEditor({ mode: 'create', id: 0 })}>
          Create {resource.singular}
        </button>
      </div>
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      <form
        className="master-form"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch({
            operation: searchOperation,
            values: readValues(
              event.currentTarget,
              companyAccountOperations[searchOperation].fields,
            ),
          });
        }}
      >
        <div className="master-toolbar">
          <label>
            Search by
            <select
              value={searchOperation}
              onChange={(event) => setSearchOperation(event.target.value as OperationKey)}
            >
              <option value={resource.list}>All records</option>
              <option value={resource.active}>Active records</option>
              <option value={resource.detail}>ID</option>
              {resource.searches.map((item) => (
                <option key={item.operation} value={item.operation}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Search</button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setSearchOperation(resource.list);
              setSearch({ operation: resource.list, values: {} });
            }}
          >
            Reset
          </button>
          <button type="button" className="secondary" onClick={() => void list.refetch()}>
            Refresh
          </button>
        </div>
        <CompanyAccountFields
          key={searchOperation}
          fields={companyAccountOperations[searchOperation].fields}
        />
      </form>
      {list.isPending ? (
        <Loading />
      ) : list.isError ? (
        <ErrorState error={list.error} retry={() => void list.refetch()} />
      ) : (
        <DataTable
          data={gridRows}
          name={resource.title}
          renderActions={(row) => {
            const id = recordId(row, resource.id);
            const source = list.data?.find(item => recordId(item, resource.id) === id);
            const fileUrl = String(value(source ?? {}, 'FileUrl') ?? '').trim();
            return (
              <div className="master-actions">
                {fileUrl && source && (
                  <button type="button" className="master-action view" onClick={() => setPreview(source)}>
                    <VisibilityOutlinedIcon fontSize="small" /> View document
                  </button>
                )}
                <button
                  type="button"
                  className="master-action view"
                  disabled={!id}
                  onClick={() => setEditor({ mode: 'view', id })}
                >
                  <VisibilityOutlinedIcon fontSize="small" />
                  View
                </button>
                <button
                  type="button"
                  className="master-action edit"
                  disabled={!id}
                  onClick={() => setEditor({ mode: 'edit', id })}
                >
                  <EditOutlinedIcon fontSize="small" />
                  Edit
                </button>
              </div>
            );
          }}
        />
      )}
      {editor && (
        <CompanyAccountEditor
          key={`${editor.mode}-${editor.id}`}
          resource={resource}
          resourceKey={resourceKey}
          {...editor}
          close={() => setEditor(null)}
          saved={saved}
        />
      )}
      {preview && (
        <FileViewer
          open
          fileUrl={String(value(preview, 'FileUrl') ?? '').trim()}
          fileName={`Company account ${recordId(preview, resource.id)} document`}
          onClose={() => setPreview(null)}
        />
      )}
    </section>
  );
}

function CompanyAccountEditor({
  resource,
  resourceKey,
  mode,
  id,
  close,
  saved,
}: {
  resource: CompanyAccountResource;
  resourceKey: string;
  mode: 'create' | 'view' | 'edit' | 'delete';
  id: number;
  close: () => void;
  saved: (message: string) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const detail = useQuery({
    queryKey: ['wallet-company-accounts', resourceKey, 'detail', id],
    enabled: mode === 'view' || mode === 'edit',
    retry: false,
    queryFn: async ({ signal }) =>
      companyAccountRows(
        (
          await companyAccountOperations[resource.detail].run(
            { [companyAccountOperations[resource.detail].fields[0].key]: id },
            signal,
          )
        ).Result,
      )[0],
  });
  const operation =
    mode === 'create' ? resource.create : mode === 'delete' ? resource.remove : resource.update;
  const fields = companyAccountOperations[operation].fields.filter(
    (field) => field.key !== resource.id,
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(undefined);
    try {
      const values =
        mode === 'delete'
          ? { [companyAccountOperations[operation].fields[0].key]: id }
          : readValues(event.currentTarget, fields);
      if (mode === 'edit') values[resource.id] = id;
      await companyAccountOperations[operation].run(values);
      await saved(
        `${title(resource.singular)} ${mode === 'create' ? 'created' : mode === 'edit' ? 'updated' : 'deleted'}.`,
      );
    } catch (caught) {
      setError(caught);
      setPending(false);
    }
  }
  const heading = `${mode === 'view' ? 'View' : title(mode)} ${resource.singular}`;
  return (
    <CreatePanelDialog
      create
      title={heading}
      onClose={() => {
        if (!pending) close();
      }}
    >
      <section className="card gateway-editor">
        <button type="button" className="secondary" disabled={pending} onClick={close}>
          Close
        </button>
        <h2>{heading}</h2>
        {error != null && <ErrorState error={error} />}
        {(mode === 'view' || mode === 'edit') && detail.isPending ? (
          <Loading />
        ) : (mode === 'view' || mode === 'edit') && detail.isError ? (
          <ErrorState error={detail.error} retry={() => void detail.refetch()} />
        ) : (mode === 'view' || mode === 'edit') && !detail.data ? (
          <p>Record not found.</p>
        ) : mode === 'view' ? (
          <dl className="master-details">
            {Object.entries(detail.data ?? {})
              .filter(([key]) => !/password|token/i.test(key))
              .map(([key, value]) => (
                <div key={key}>
                  <dt>{title(key)}</dt>
                  <dd>{textValue(value) || '—'}</dd>
                </div>
              ))}
          </dl>
        ) : (
          <form className="master-form" onSubmit={submit}>
            {mode === 'delete' ? (
              <p>
                Delete {resource.singular} {id}?
              </p>
            ) : (
              <CompanyAccountFields fields={fields} initial={detail.data} />
            )}
            <button type="submit" disabled={pending}>
              {pending ? 'Saving...' : mode === 'delete' ? 'Confirm delete' : 'Save'}
            </button>
          </form>
        )}
      </section>
    </CreatePanelDialog>
  );
}
