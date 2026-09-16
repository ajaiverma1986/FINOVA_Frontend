import { useMemo, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { DataTable, title, textValue } from '../../components/DataTable';
import { ErrorState, Loading } from '../../components/Status';
import CreatePanelDialog from '../AppManager/CreatePanelDialog';
import ConfigFields, { readValues } from './ConfigFields';
import {
  configOperations,
  configResources,
  type Values,
  type OperationKey,
  type ConfigResource,
} from './configResources';
import '../Masters/MasterDataCrudPage.css';

type Row = Record<string, unknown>;
export function configRows(result: unknown): Row[] {
  if (Array.isArray(result))
    return result.filter((row): row is Row => !!row && typeof row === 'object');
  if (result && typeof result === 'object') {
    const nested = Object.values(result).find(Array.isArray);
    return nested ? configRows(nested) : [result as Row];
  }
  return [];
}
function recordId(row: Row, key: string) {
  const match = Object.keys(row).find((name) => name.toLowerCase() === key.toLowerCase());
  return Number(match ? row[match] : 0);
}

export default function ConfigCrudComponent({ resourceKey }: { resourceKey: string }) {
  const resource = configResources[resourceKey];
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
  const list = useQuery({
    queryKey: ['config', resourceKey, 'list', search],
    queryFn: async ({ signal }) =>
      configRows((await configOperations[search.operation].run(search.values, signal)).Result),
    retry: false,
  });
  const gridRows = useMemo(() => {
    const hidden = new Set(resource.hiddenColumns?.map(column => column.toLowerCase()));
    return list.data?.map(row => Object.fromEntries(
      Object.entries(row).filter(([column]) => !hidden.has(column.toLowerCase())),
    ));
  }, [list.data, resource.hiddenColumns]);
  async function saved(message: string) {
    setEditor(null);
    setMessage(message);
    await cache.invalidateQueries({ queryKey: ['config', resourceKey] });
  }
  return (
    <section className="card master-data-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Configuration</p>
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
            values: readValues(event.currentTarget, configOperations[searchOperation].fields),
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
        <ConfigFields key={searchOperation} fields={configOperations[searchOperation].fields} />
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
            return (
              <div className="master-actions">
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
                <button
                  type="button"
                  className="master-action delete"
                  disabled={!id}
                  onClick={() => setEditor({ mode: 'delete', id })}
                >
                  <DeleteOutlineIcon fontSize="small" />
                  Delete
                </button>
              </div>
            );
          }}
        />
      )}
      {editor && (
        <ConfigEditor
          key={`${editor.mode}-${editor.id}`}
          resource={resource}
          resourceKey={resourceKey}
          {...editor}
          close={() => setEditor(null)}
          saved={saved}
        />
      )}
    </section>
  );
}

function ConfigEditor({
  resource,
  resourceKey,
  mode,
  id,
  close,
  saved,
}: {
  resource: ConfigResource;
  resourceKey: string;
  mode: 'create' | 'view' | 'edit' | 'delete';
  id: number;
  close: () => void;
  saved: (message: string) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const detail = useQuery({
    queryKey: ['config', resourceKey, 'detail', id],
    enabled: mode === 'view' || mode === 'edit',
    retry: false,
    queryFn: async ({ signal }) =>
      configRows(
        (
          await configOperations[resource.detail].run(
            { [configOperations[resource.detail].fields[0].key]: id },
            signal,
          )
        ).Result,
      )[0],
  });
  const operation =
    mode === 'create' ? resource.create : mode === 'delete' ? resource.remove : resource.update;
  const fields = configOperations[operation].fields.filter((field) => field.key !== resource.id);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(undefined);
    try {
      const values =
        mode === 'delete'
          ? { [configOperations[operation].fields[0].key]: id }
          : readValues(event.currentTarget, fields);
      if (mode === 'edit') values[resource.id] = id;
      await configOperations[operation].run(values);
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
              <ConfigFields fields={fields} initial={detail.data} />
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
