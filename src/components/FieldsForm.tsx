import { useEffect } from 'react';
import { useForm, useWatch, type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { operationRequest } from '../core/api';
import type { Fields, Field } from '../core/types';
import { operations, lookupFields } from '../services/catalog';
import { ErrorState } from './Status';

function lookupValue(row: Record<string, unknown>, field: string) {
  return row[Object.keys(row).find((key) => key.toLowerCase() === field.toLowerCase()) || field];
}
function InputField({
  field,
  register,
  errors,
  read,
  anonymous,
  values,
}: {
  field: Field;
  register: UseFormRegister<Fields>;
  errors: FieldErrors<Fields>;
  read: boolean;
  anonymous?: boolean;
  values: Fields;
}) {
  const lookup = anonymous ? undefined : lookupFields[field.name.toLowerCase()];
  const params: Fields = { ...lookup?.params };
  Object.entries(lookup?.depends || {}).forEach(([parameter, source]) => {
    const key = Object.keys(values).find((key) => key.toLowerCase() === source.toLowerCase());
    if (key && values[key] !== '') params[parameter] = values[key];
  });
  const ready =
    !!lookup &&
    Object.keys(lookup.depends || {}).every(
      (key) => params[key] !== undefined && params[key] !== '' && params[key] !== null,
    );
  const options = useQuery({
    queryKey: ['lookup', lookup?.operation, params],
    queryFn: ({ signal }) => operationRequest(operations[lookup!.operation], params, signal),
    enabled: ready,
    staleTime: 300_000,
  });
  const required = (!read && field.required) || ['PageNo', 'PageSize'].includes(field.name);
  const id = 'field-' + field.name;
  const kind =
    field.type === 'number'
      ? 'number'
      : field.type === 'date' || /date|^dob$/i.test(field.name)
        ? 'date'
        : /password/i.test(field.name)
          ? 'password'
          : /email/i.test(field.name)
            ? 'email'
            : /mobile|phone/i.test(field.name)
              ? 'tel'
              : 'text';
  const registration = register(field.name, {
    required: required ? `${field.label} is required.` : false,
    ...(field.type === 'number'
      ? {
          setValueAs: (value: string) => (value === '' ? (read ? 0 : null) : Number(value)),
          validate: (value: unknown) =>
            value === null || Number.isFinite(value) || 'Enter a valid number.',
        }
      : {}),
    ...(/amount/i.test(field.name) && !read
      ? { min: { value: 0.01, message: 'Enter an amount greater than zero.' } }
      : {}),
    ...(['PageNo', 'PageSize'].includes(field.name)
      ? {
          min: { value: 1, message: 'Enter a value of at least 1.' },
          validate: (value: unknown) => Number.isInteger(value) || 'Enter a whole number.',
        }
      : {}),
    ...(/mobile|phone/i.test(field.name)
      ? { pattern: { value: /^\d{10}$/, message: 'Enter a 10-digit mobile number.' } }
      : {}),
  });
  const records = Array.isArray(options.data?.Result)
    ? (options.data.Result as Record<string, unknown>[])
    : [];
  return (
    <label className="field" htmlFor={id}>
      <span>
        {field.label}
        {required && <span aria-hidden="true"> *</span>}
      </span>
      {field.type === 'file' ? (
        <input id={id} type="file" {...registration} />
      ) : field.type === 'boolean' ? (
        <input id={id} type="checkbox" {...registration} />
      ) : lookup && records.length ? (
        <select id={id} {...registration}>
          <option value="">Select {field.label.toLowerCase()}</option>
          {records.map((row, index) => {
            const value = lookupValue(row, lookup.key);
            return (
              <option key={index} value={String(value ?? '')}>
                {String(lookupValue(row, lookup.label) ?? value ?? 'Unknown')}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          id={id}
          type={kind}
          step={kind === 'number' ? 'any' : undefined}
          autoComplete={kind === 'password' ? 'new-password' : undefined}
          {...registration}
          aria-invalid={!!errors[field.name]}
          aria-describedby={errors[field.name] ? id + '-error' : undefined}
        />
      )}
      {options.isError && (
        <span className="field-error">Unable to load choices. Enter the ID or retry later.</span>
      )}
      {errors[field.name] && (
        <span id={id + '-error'} className="field-error">
          {String(errors[field.name]?.message)}
        </span>
      )}
    </label>
  );
}
export function FieldsForm({
  fields,
  initial,
  read = false,
  pending = false,
  submitLabel,
  onSubmit,
  anonymous = false,
}: {
  fields: Field[];
  initial: Fields;
  read?: boolean;
  pending?: boolean;
  submitLabel: string;
  onSubmit: (values: Fields) => Promise<void>;
  anonymous?: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ defaultValues: initial });
  const currentValues = useWatch({ control }) as Fields;
  useEffect(() => reset(initial), [initial, reset]);
  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        const data: Fields = {};
        fields.forEach((field) => {
          if (field.uiOnly) return;
          const value = values[field.name];
          data[field.name] =
            field.type === 'file'
              ? (value as unknown as FileList)?.[0] || null
              : (value ?? (read ? (field.type === 'number' ? 0 : '') : null));
        });
        try {
          await onSubmit(data);
        } catch (error) {
          setError('root', {
            message: error instanceof Error ? error.message : 'The request failed.',
          });
        }
      })}
    >
      <fieldset disabled={pending || isSubmitting}>
        <div className="form-grid">
          {fields.map((field) => (
            <InputField
              key={field.name}
              field={field}
              register={register}
              errors={errors}
              read={read}
              anonymous={anonymous}
              values={currentValues}
            />
          ))}
        </div>
        {errors.root?.message && <ErrorState error={new Error(errors.root.message)} />}
        <button type="submit">{pending || isSubmitting ? 'Please wait…' : submitLabel}</button>
      </fieldset>
    </form>
  );
}
