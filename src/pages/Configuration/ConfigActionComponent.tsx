import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ErrorState } from '../../components/Status';
import { ResultView } from '../../components/ResultView';
import ConfigFields, { readValues } from './ConfigFields';
import { configOperations } from './configResources';
import '../Masters/MasterDataCrudPage.css';

export default function ConfigActionComponent({
  operation,
  title,
}: {
  operation: 'GetServicePolicy' | 'AddTransacttionSlab';
  title: string;
}) {
  const cache = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const [result, setResult] = useState<unknown>();
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(undefined);
    setSuccess(false);
    setResult(undefined);
    try {
      const response = await configOperations[operation].run(
        readValues(event.currentTarget, configOperations[operation].fields),
      );
      setResult(response.Result);
      setSuccess(true);
      if (operation === 'AddTransacttionSlab')
        await cache.invalidateQueries({ queryKey: ['config', 'transaction'] });
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="card master-data-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Configuration</p>
          <h1>{title}</h1>
        </div>
      </div>
      <form className="master-form" onSubmit={submit}>
        <ConfigFields fields={configOperations[operation].fields} />
        {error != null && <ErrorState error={error} />}
        <button type="submit" disabled={pending}>
          {pending
            ? 'Please wait...'
            : operation === 'GetServicePolicy'
              ? 'Get service policy'
              : 'Add transaction slab'}
        </button>
      </form>
      {success && (
        <p role="status">
          {operation === 'GetServicePolicy' ? 'Service policy loaded.' : 'Transaction slab added.'}
        </p>
      )}
      {result !== undefined && <ResultView value={result} name={title} />}
    </section>
  );
}
