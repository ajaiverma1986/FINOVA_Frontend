import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MasterDataService } from '../../services/MasterDataService';
import { fieldValue, recordId, rows } from './userWizardData';

export default function PincodeDataSelect({
  pincode,
  value,
  onChange,
}: {
  pincode: string;
  value: number;
  onChange: (id: number) => void;
}) {
  const code = pincode.trim();
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(code), 350);
    return () => window.clearTimeout(timer);
  }, [code]);
  const lookup = useQuery({
    queryKey: ['pincode-data', code],
    enabled: !!code && code === debounced,
    queryFn: async ({ signal }) =>
      rows((await MasterDataService.demographicDataListByPincode(code, signal)).Result),
    retry: false,
  });
  const options = (lookup.data ?? [])
    .map((row) => ({
      id: recordId(row, 'PincodeDataId'),
      label: ['AreaName', 'SubDistrictName', 'DistrictName', 'StateName']
        .map((key) => fieldValue(row, key))
        .filter(Boolean)
        .join(', '),
    }))
    .filter((item) => item.id > 0);
  const loading = !!code && (code !== debounced || lookup.isFetching);
  return (
    <>
      <select
        required
        value={value || ''}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        <option value="">
          {!code
            ? 'Enter a pincode first'
            : loading
              ? 'Loading areas...'
              : lookup.isError
                ? 'Unable to load areas'
                : options.length
                  ? 'Select pincode data'
                  : 'No areas found for this pincode'}
        </option>
        {!!value && !options.some((option) => option.id === value) && (
          <option value={value}>Current selection ({value})</option>
        )}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label || `Area ${option.id}`}
          </option>
        ))}
      </select>
      {lookup.isError && (
        <span role="alert">
          Could not load pincode data.{' '}
          <button type="button" onClick={() => void lookup.refetch()}>
            Retry pincode lookup
          </button>
        </span>
      )}
    </>
  );
}
