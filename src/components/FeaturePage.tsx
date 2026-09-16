import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { operationRequest } from '../core/api';
import { useAuth } from '../core/auth';
import type { ApiResponse, Fields, Operation, PageDefinition } from '../core/types';
import { pageOperations, isLookup } from '../services/catalog';
import { FieldsForm } from './FieldsForm';
import { ResultView } from './ResultView';
import { ErrorState, Loading } from './Status';

function OperationPanel({
  operation,
  page,
  selected,
  onSelect,
}: {
  operation: Operation;
  page: PageDefinition;
  selected: Fields;
  onSelect: (row: Record<string, unknown>) => void;
}) {
  const { session } = useAuth();
  const [params] = useSearchParams();
  const cache = useQueryClient();
  const [result, setResult] = useState<ApiResponse>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const [success, setSuccess] = useState(false);
  const inFlight = useRef(false);
  const fields = operation.fields;
  const initial = useMemo(
    () =>
      Object.fromEntries(
        fields.map((field) => {
          const aliases: Record<string, string[]> = {
            kycid: ['UserKYCID'],
            requestid: page.path.toLowerCase().includes('acc')
              ? ['OriginatorAccountID', 'RequestID']
              : ['RequestID'],
            userid: ['UserId'],
          };
          const selectedKey =
            Object.keys(selected).find((key) => key.toLowerCase() === field.name.toLowerCase()) ||
            aliases[field.name.toLowerCase()]?.find((key) => key in selected);
          const parameterKey = [...params.keys()].find(
            (key) => key.toLowerCase() === field.name.toLowerCase(),
          );
          return [
            field.name,
            selectedKey
              ? selected[selectedKey]
              : parameterKey
                ? params.get(parameterKey)
                : /username/i.test(field.name)
                  ? session?.username || ''
                  : (page.defaults[field.name] ??
                    field.default ??
                    (operation.read && field.type === 'number' ? 0 : '')),
          ];
        }),
      ),
    [fields, selected, params, session?.username, page.defaults, operation.read],
  ) as Fields;
  const [filters, setFilters] = useState<Fields>(initial);
  const auto =
    operation.read &&
    (operation.fields.length === 0 || operation.fields.some((field) => field.name === 'PageNo'));
  const [enabled, setEnabled] = useState(auto);
  const query = useQuery({
    queryKey: ['feature', page.path, operation.id, filters],
    queryFn: ({ signal }) => operationRequest(operation, filters, signal),
    enabled: operation.read && enabled,
    retry: false,
  });
  const shown = operation.read ? query.data : result;
  async function submit(values: Fields) {
    if (operation.read) {
      setFilters(values);
      setEnabled(true);
      if (JSON.stringify(filters) === JSON.stringify(values)) await query.refetch();
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(undefined);
    setSuccess(false);
    try {
      const response = await operationRequest(operation, values);
      if (typeof response.Result === 'number' && response.Result <= 0)
        throw new Error('The server did not save the record.');
      setResult(response);
      setSuccess(true);
      await cache.invalidateQueries({ queryKey: ['feature'] });
      await cache.invalidateQueries({ queryKey: ['lookup'] });
    } catch (e) {
      setError(e);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  const listPage = Number(filters.PageNo || 1),
    pageSize = Number(filters.PageSize || 20);
  return (
    <section className={page.path === '/Dashboard/DemographicDetail' ? 'operation' : 'card operation'}>
      {!operation.read && <h2>{operation.title}</h2>}
      {(operation.fields.length > 0 || !operation.read) && (
        <FieldsForm
          fields={fields}
          initial={initial}
          read={operation.read}
          pending={pending}
          submitLabel={operation.read ? 'Search' : operation.multipart ? 'Upload' : 'Submit'}
          onSubmit={submit}
        />
      )}
      {success && (
        <p className="notice success" role="status">
          Request completed successfully.
        </p>
      )}
      {(error || query.error) && (
        <ErrorState
          error={error || query.error}
          retry={
            operation.read
              ? () => {
                  void query.refetch();
                }
              : undefined
          }
        />
      )}
      {query.isFetching && <Loading />}
      {shown && (
        <ResultView
          value={shown.Result ?? (shown.status !== undefined ? shown : undefined)}
          columns={page.columns}
          name={operation.title}
          onSelect={onSelect}
        />
      )}
      {operation.read && operation.fields.some((field) => field.name === 'PageNo') && shown && (
        <div className="toolbar">
          <span>
            {shown.TotalRecords ?? 'Unknown'} total server records · Server page {listPage}
          </span>
          <button
            className="secondary"
            disabled={listPage <= 1 || query.isFetching}
            onClick={() => setFilters({ ...filters, PageNo: listPage - 1 })}
          >
            Previous server page
          </button>
          <button
            className="secondary"
            disabled={
              query.isFetching ||
              (typeof shown.TotalRecords === 'number'
                ? listPage * pageSize >= shown.TotalRecords
                : !Array.isArray(shown.Result) || shown.Result.length < pageSize)
            }
            onClick={() => setFilters({ ...filters, PageNo: listPage + 1 })}
          >
            Next server page
          </button>
        </div>
      )}
    </section>
  );
}
export function FeaturePage({ page }: { page: PageDefinition }) {
  const [selected, setSelected] = useState<Fields>({});
  const [showSelectedDetails, setShowSelectedDetails] = useState(false);
  const all = useMemo(() => pageOperations(page), [page]);
  const main = all.filter((op) => !isLookup(op, page));
  const visible = main.length ? main : all;
  const preferred: Record<string, string> = {
    '/Dashboard/DistrictMaster': 'MasterDataService.DistrictMasterList',
    '/Dashboard/KycTypeMaster': 'MasterDataService.KycTypeList',
    '/Dashboard/ServiceType': 'MasterDataService.ListServiceType',
    '/Dashboard/PaymentMode': 'MasterDataService.ListPaymentModes',
    '/Dashboard/Commdistr': 'ConfigService.ListCommissionDistribution',
    '/Dashboard/topupcrglist': 'ConfigService.ListTopupCharge',
    '/Dashboard/txtslablist': 'ConfigService.ListTransactionslab',
    '/Dashboard/addtxnslab': 'ConfigService.AddNewTransactionSlab',
  };
  const [active, setActive] = useState(preferred[page.path] || visible[0]?.id || '');
  useEffect(() => {
    document.title = page.title + ' · FINOVA';
  }, [page.title]);
  const operation = visible.find((op) => op.id === active);
  const masterPage = page.path === '/Dashboard/DemographicDetail';
  return (
    <section className={masterPage ? 'card master-data-page' : undefined}>
      <div className="page-heading">
        <div>
          <h1>{page.title}</h1>
        </div>
      </div>
      {visible.length > 1 && (
        <div className="tabs" aria-label="Page actions">
          {visible.map((op) => (
            <button
              key={op.id}
              className={active === op.id ? 'active' : 'secondary'}
              onClick={() => setActive(op.id)}
            >
              {op.title}
            </button>
          ))}
        </div>
      )}
      {Object.keys(selected).length > 0 && (
        <>
          <div className="notice toolbar">
            <span>Record selected. Choose an action to use its details.</span>
            <button
              className="secondary"
              onClick={() => setShowSelectedDetails((visible) => !visible)}
            >
              {showSelectedDetails ? 'Hide details' : 'View details'}
            </button>
          <button className="secondary" onClick={() => setSelected({})}>
            Clear selection
          </button>
          </div>
          {showSelectedDetails && (
            <section className="card selected-record" aria-label="Selected record details">
              <h2>Selected record</h2>
              <ResultView value={selected} name="Selected record" />
            </section>
          )}
        </>
      )}
      {operation ? (
        <OperationPanel
          key={operation.id}
          operation={operation}
          page={page}
          selected={selected}
          onSelect={(row) =>
            (() => {
              setSelected(
                Object.fromEntries(
                  Object.entries(row).filter(
                    ([, value]) =>
                      value === null || ['string', 'number', 'boolean'].includes(typeof value),
                  ),
                ) as Fields,
              );
              setShowSelectedDetails(false);
            })()
          }
        />
      ) : (
        <div className="card">
          <p>No backend action is defined for this screen in the existing application.</p>
        </div>
      )}
    </section>
  );
}
